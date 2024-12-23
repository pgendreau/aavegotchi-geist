// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, AavegotchiWearableConfigs, WearablesConfig, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibWearablesConfig} from "../libraries/LibWearablesConfig.sol";

contract WearablesConfigFacet is Modifiers {

    /**
     * @notice The number of free slots available for wearables configurations.
     */
    uint8 public constant WEARABLESCONFIG_FREE_SLOTS = 3;
    /**
     * @notice The price to create a wearable config slot once the free slots have been reached.
     */
    uint256 public constant WEARABLESCONFIG_SLOT_PRICE = 1000000000000000000; // 1 GHST

    event WearablesConfigCreated(address indexed owner, uint256 indexed tokenId, uint256 indexed wearablesConfigId, uint256[EQUIPPED_WEARABLE_SLOTS] wearables, uint256 value);
    event WearablesConfigUpdated(address indexed owner, uint256 indexed tokenId, uint256 indexed wearablesConfigId, uint256[EQUIPPED_WEARABLE_SLOTS] wearables);
    event WearablesConfigPaymentReceived(address indexed owner, uint256 indexed tokenId, uint256 indexed wearablesConfigId, uint256 value);

    /**
     * @notice Creates and storesa new wearables configuration.
     * @param _tokenId The ID of the aavegotchi to create the wearables configuration for.
     * @param _name The name of the wearables configuration.
     * @param _wearables The wearables to store for this wearables configuration.
     * @return The ID of the newly created wearables configuration.
     */
    function createWearablesConfig(
        uint256 _tokenId,
        string calldata _name,
        uint256[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToStore
    )
        external
        payable
        onlyAavegotchiOwner(_tokenId)
        returns (uint256 newWearablesConfigId)
    {
        // check that the aavegotchi has been summoned
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "WearablesConfigFacet: Can only create wearables config for Aavegotchi");
        // check that wearables are valid and for the right slots
        require(LibWearablesConfig._checkValidWearables(_wearablesToStore), "WearablesConfigFacet: Invalid wearables");
        // check that name is not empty
        require(bytes(_name).length > 0, "WearablesConfigFacet: WearablesConfig name cannot be blank");

        address owner = LibMeta.msgSender();
         
        // get the next available slot
        uint256 newWearablesConfigId = LibWearablesConfig._getNextWearablesConfigId(owner, _tokenId);

        // if the ownner has reached the free slots limit then they need to pay for the extra slot
        if (newWearablesConfigId >= WEARABLESCONFIG_FREE_SLOTS) {
            require(msg.value == WEARABLESCONFIG_SLOT_PRICE, "WearablesConfigFacet: Incorrect GHST value sent");

            // send GHST to the dao treasury
            (bool success, ) = payable(s.daoTreasury).call{value: msg.value}("");
            require(success, "WearablesConfigFacet: Failed to send GHST to DAO treasury");

            emit WearablesConfigPaymentReceived(owner, _tokenId, newWearablesConfigId, msg.value);
        }

        // create the new wearables config and add it to the gotchi for that owner
        WearablesConfig memory newWearablesConfig = WearablesConfig({name: _name, wearables: _wearablesToStore});
        s.gotchiWearableConfigs[_tokenId][owner].push(newWearablesConfig);
        s.ownerGotchiSlotsUsed[owner][_tokenId] += 1;

        emit WearablesConfigCreated(owner, _tokenId, newWearablesConfigId, _wearablesToStore, msg.value);

        return newWearablesConfigId;
    }

    /// @notice Updates the wearables config for the given wearables config id
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @param _name The name of the wearables configuration
    /// @param _wearablesToStore The wearables to store
    /// @dev if _name is empty, only wearables are updated.
    function updateWearablesConfig(
        uint256 _tokenId,
        uint256 _wearablesConfigId,
        string calldata _name,
        uint256[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToStore
    )
        external
    {
        address owner = LibMeta.msgSender();

        // check that wearables are valid and for the right slots
        require(LibWearablesConfig._wearablesConfigExists(owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");

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
    /// @return true if the wearables config exists
    function isValidWearablesConfig(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (bool exists) {
        exists = LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId);
    }

    /// @notice Returns the wearables config for the given wearables config id
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return The wearables config
    function getWearablesConfig(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (WearablesConfig memory wearablesConfig) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.gotchiWearableConfigs[_tokenId][_owner][_wearablesConfigId];
    }

    /// @notice Returns the name of the wearables config for the given wearables config id
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return The name of the wearables config
    function getWearablesConfigName(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (string memory name) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.gotchiWearableConfigs[_tokenId][_owner][_wearablesConfigId].name;
    }

    /// @notice Returns the wearables for the given wearables config id
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @param _wearablesConfigId The ID of the wearables configuration to update
    /// @return The wearables stored for this wearables config
    function getWearablesConfigWearables(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (uint256[EQUIPPED_WEARABLE_SLOTS] memory wearables) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.gotchiWearableConfigs[_tokenId][_owner][_wearablesConfigId].wearables;
    }

    /// @notice Returns the number of wearables configs for the given aavegotchi for this owner
    /// @param _owner The owner of the aavegotchi
    /// @param _tokenId The ID of the aavegotchi to update the wearables configuration for
    /// @return The number of wearables configs
    function getAavegotchiWearablesConfigCount(address _owner, uint256 _tokenId) external view returns (uint256 slotsUsed) {
        return s.ownerGotchiSlotsUsed[_owner][_tokenId];
    }
}
