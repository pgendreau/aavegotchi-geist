// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, WearablesConfig, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibWearablesConfig} from "../libraries/LibWearablesConfig.sol";

contract WearablesConfigFacet is Modifiers {

    // constants
    uint256 private constant MAX_UINT8 = 2**8 - 1;
    uint8 public constant WEARABLESCONFIG_FREE_SLOTS = 3;
    uint256 public constant WEARABLESCONFIG_SLOT_PRICE = 1000000000000000000; // 1 GHST
    uint256 public constant WEARABLESCONFIG_OWNER_FEE = 100000000000000000; // 0.1 GHST

    // events
    event WearablesConfigCreated(address indexed owner, uint256 indexed tokenId, uint8 indexed wearablesConfigId, uint16[EQUIPPED_WEARABLE_SLOTS] wearables, uint256 value);
    event WearablesConfigUpdated(address indexed owner, uint256 indexed tokenId, uint8 indexed wearablesConfigId, uint16[EQUIPPED_WEARABLE_SLOTS] wearables);
    event WearablesConfigDaoPaymentReceived(address indexed owner, uint256 indexed tokenId, uint8 indexed wearablesConfigId, uint256 value);
    event WearablesConfigOwnerPaymentReceived(address indexed sender, address indexed owner, uint256 indexed tokenId, uint8 wearablesConfigId, uint256 value);

    /// @notice Creates and stores a new wearables configuration (max 255 per Aavegotchi per owner).
    /// @notice First three slots are free, the rest are paid.
    /// @notice To create a wearables config for someone else aavegotchi there is a fee
    /// @notice We support wearables config creation for unbridged gotchis (config owner is set to sender)
    /// @param _tokenId The ID of the aavegotchi to create the wearables configuration for.
    /// @param _name The name of the wearables configuration.
    /// @param _wearablesToStore The wearables to store for this wearables configuration.
    /// @return wearablesConfigId The ID of the newly created wearables configuration.
    function createWearablesConfig(
        uint256 _tokenId,
        string calldata _name,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToStore
    )
        external
        payable
        returns (uint8 wearablesConfigId)
    {
        // check that creation of this wearables config is allowed (only aavegotchi or unbridged)
        require(LibWearablesConfig._checkAavegotchiOrUnbridged(_tokenId), "WearablesConfigFacet: Not allowed to create wearables config");
        // check that wearables are valid and for the right slots
        require(LibWearablesConfig._checkValidWearables(_wearablesToStore), "WearablesConfigFacet: Invalid wearables");
        // check that name is not empty
        require(bytes(_name).length > 0, "WearablesConfigFacet: WearablesConfig name cannot be blank");

        address sender = LibMeta.msgSender();
        address owner = s.aavegotchis[_tokenId].owner;
        bool paidslot;
        bool notowner;
        uint256 fee;
         
        if (owner == address(0)) {
          // set the owner to the sender for unbridged gotchis
          owner = sender;
        }

        // get the next available slot
        wearablesConfigId = LibWearablesConfig._getNextWearablesConfigId(owner, _tokenId);
        // solidity will throw if slots used overflows
        require(wearablesConfigId < 2**8 - 1, "WearablesConfigFacet: No more wearables config slots available");

        // if the owner has reached the free slots limit then they need to pay for the extra slot
        if (wearablesConfigId >= WEARABLESCONFIG_FREE_SLOTS) {
            paidslot = true;
            fee += WEARABLESCONFIG_SLOT_PRICE;
        }

        // if the sender is not the owner and the gotchi has been bridged
        // then they need to pay a fee to the owner
        if (sender != owner) {
            notowner = true;
            fee += WEARABLESCONFIG_OWNER_FEE;
        }

        if (fee > 0) {
            require(msg.value == fee, "WearablesConfigFacet: Incorrect GHST value sent");

            if (paidslot) {
                // send GHST to the dao treasury
                (bool success, ) = payable(s.daoTreasury).call{value: WEARABLESCONFIG_SLOT_PRICE}("");
                require(success, "WearablesConfigFacet: Failed to send GHST to DAO treasury");

                emit WearablesConfigDaoPaymentReceived(owner, _tokenId, wearablesConfigId, WEARABLESCONFIG_SLOT_PRICE);
            }

            if (notowner) {
                // send GHST to the owner
                (bool success, ) = payable(owner).call{value: WEARABLESCONFIG_OWNER_FEE}("");
                require(success, "WearablesConfigFacet: Failed to send GHST to owner");

                emit WearablesConfigOwnerPaymentReceived(sender, owner, _tokenId, wearablesConfigId, WEARABLESCONFIG_OWNER_FEE);
            }
        }

        // create the new wearables config and add it to the gotchi for that owner
        WearablesConfig memory wearablesConfig = WearablesConfig({name: _name, wearables: _wearablesToStore});
        s.gotchiWearableConfigs[_tokenId][owner].push(wearablesConfig);
        s.ownerGotchiSlotsUsed[owner][_tokenId] += 1;

        emit WearablesConfigCreated(owner, _tokenId, wearablesConfigId, _wearablesToStore, msg.value);
    }

    /// @notice Updates the wearables config for the given wearables config id
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @param _name The name of the wearables configuration
    /// @param _wearablesToStore The wearables to store
    /// @dev if _name is empty, only wearables are updated.
    function updateWearablesConfig(
        uint256 _tokenId,
        uint8 _wearablesConfigId,
        string calldata _name,
        uint16[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToStore
    )
        external payable
    {
        address sender = LibMeta.msgSender();
        address owner = s.aavegotchis[_tokenId].owner;

        // check that update of this wearables config is allowed (only aavegotchi or unbridged)
        require(LibWearablesConfig._checkAavegotchiOrUnbridged(_tokenId), "WearablesConfigFacet: Not allowed to update wearables config");
        // check that wearables are valid and for the right slots
        require(LibWearablesConfig._checkValidWearables(_wearablesToStore), "WearablesConfigFacet: Invalid wearables");

        if (owner == address(0)) {
          // set the owner to the sender for unbridged gotchis
          owner = sender;
        }

        // make sure we are updating an existing wearables config
        require(LibWearablesConfig._wearablesConfigExists(owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");

        // if the sender is not the owner and the gotchi has been bridged
        // then they need to pay a fee to the owner
        if (sender != owner) {
            (bool success, ) = payable(owner).call{value: WEARABLESCONFIG_OWNER_FEE}("");
            require(success, "WearablesConfigFacet: Failed to send GHST to owner");

            emit WearablesConfigOwnerPaymentReceived(sender, owner, _tokenId, _wearablesConfigId, WEARABLESCONFIG_OWNER_FEE);
        }

        // skip if name is empty
        if (bytes(_name).length > 0) {
            s.gotchiWearableConfigs[_tokenId][owner][_wearablesConfigId].name = _name;
        }

        // update the wearables
        s.gotchiWearableConfigs[_tokenId][owner][_wearablesConfigId].wearables = _wearablesToStore;

        emit WearablesConfigUpdated(owner, _tokenId, _wearablesConfigId, _wearablesToStore);
    }

    /// @notice Returns true if the given wearables config id exists for the given aavegotchi
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return exists true if the wearables config exists
    function wearablesConfigExists(address _owner, uint256 _tokenId, uint8 _wearablesConfigId) external view returns (bool exists) {
        exists = LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId);
    }

    /// @notice Returns the wearables config for the given wearables config id
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return wearablesConfig The wearables config
    function getWearablesConfig(address _owner, uint256 _tokenId, uint8 _wearablesConfigId) external view returns (WearablesConfig memory wearablesConfig) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.gotchiWearableConfigs[_tokenId][_owner][_wearablesConfigId];
    }

    /// @notice Returns the name of the wearables config for the given wearables config id
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return name The name of the wearables config
    function getWearablesConfigName(address _owner, uint256 _tokenId, uint8 _wearablesConfigId) external view returns (string memory name) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        name = s.gotchiWearableConfigs[_tokenId][_owner][_wearablesConfigId].name;
    }

    /// @notice Returns the wearables for the given wearables config id
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return wearables The wearables stored for this wearables config
    function getWearablesConfigWearables(address _owner, uint256 _tokenId, uint8 _wearablesConfigId) external view returns (uint16[EQUIPPED_WEARABLE_SLOTS] memory wearables) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        wearables = s.gotchiWearableConfigs[_tokenId][_owner][_wearablesConfigId].wearables;
    }

    /// @notice Returns the number of wearables configs for the given aavegotchi for this owner
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @return slotsUsed The number of wearables configs
    function getAavegotchiWearablesConfigCount(address _owner, uint256 _tokenId) external view returns (uint8 slotsUsed) {
        slotsUsed = s.ownerGotchiSlotsUsed[_owner][_tokenId];
    }
}
