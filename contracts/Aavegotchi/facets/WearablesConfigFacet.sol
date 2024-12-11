// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {Modifiers, AavegotchiWearableConfigs, WearablesConfig, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";
import {LibWearablesConfig} from "../libraries/LibWearablesConfig.sol";

contract WearablesConfigFacet is Modifiers {

    uint8 public constant WEARABLESCONFIG_FREE_SLOTS = 3;
    uint256 public constant WEARABLESCONFIG_SLOT_PRICE = 1000000000000000000; // 1 GHST

    event WearablesConfigCreated(address indexed owner, uint256 indexed tokenId, uint256 indexed slot, uint256[EQUIPPED_WEARABLE_SLOTS] wearables, uint256 value);
    event WearablesConfigUpdated(address indexed owner, uint256 indexed tokenId, uint256 indexed slot, uint256[EQUIPPED_WEARABLE_SLOTS] wearables);
    event WearablesConfigPaymentReceived(address indexed owner, uint256 indexed tokenId, uint256 indexed wearablesConfigId, uint256 value);

    function createWearablesConfig(uint256 _tokenId, string calldata _name, uint256[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToStore) external payable returns (uint256 wearablesConfigId) {
        // check that tokenId is a gotchi
        // check that msg.sender is gotchi owner (owned or rented)
        // check that wearables are valid and for the right slots
        require(bytes(_name).length > 0, "WearablesConfigFacet: WearablesConfig name cannot be blank");

        address owner = LibMeta.msgSender();

        if (s.ownersWearableConfigs[owner][_tokenId].slotsUsed >= WEARABLESCONFIG_FREE_SLOTS) {
            require(msg.value == WEARABLESCONFIG_SLOT_PRICE, "WearablesConfigFacet: Incorrect GHST value sent");

            (bool success, ) = payable(s.daoTreasury).call{value: msg.value}("");
            require(success, "WearablesConfigFacet: Failed to send ETH to DAO treasury");
        }

        uint256 wearablesConfigId = LibWearablesConfig._getNewWearablesConfigId(owner, _tokenId);
        WearablesConfig memory wearablesConfig = WearablesConfig({name: _name, wearables: _wearablesToStore});

        s.ownersWearableConfigs[owner][_tokenId].wearableConfigs.push(wearablesConfig);

        // increment slots used
        s.ownersWearableConfigs[owner][_tokenId].slotsUsed += 1;

        emit WearablesConfigCreated(owner, _tokenId, wearablesConfigId, _wearablesToStore, msg.value);

        return wearablesConfigId;
    }

    /// @dev if _name is empty, name is not updated
    function updateWearablesConfig(uint256 _tokenId, uint256 _wearablesConfigId, string calldata _name, uint256[EQUIPPED_WEARABLE_SLOTS] calldata _wearablesToStore) external {
        address owner = LibMeta.msgSender();

        // check that wearables are valid and for the right slots
        require(LibWearablesConfig._wearablesConfigExists(owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");

        if (bytes(_name).length > 0) {
            s.ownersWearableConfigs[owner][_tokenId].wearableConfigs[_wearablesConfigId].name = _name;
        }

        s.ownersWearableConfigs[owner][_tokenId].wearableConfigs[_wearablesConfigId].wearables = _wearablesToStore;

        emit WearablesConfigUpdated(owner, _tokenId, _wearablesConfigId, _wearablesToStore);
    }

    function isValidWearablesConfig(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (bool exists) {
        exists = LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId);
    }

    function getwearablesConfig(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (WearablesConfig memory wearablesConfig) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.ownersWearableConfigs[_owner][_tokenId].wearableConfigs[_wearablesConfigId];
    }

    function getWearablesConfigName(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (string memory name) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.ownersWearableConfigs[_owner][_tokenId].wearableConfigs[_wearablesConfigId].name;
    }

    function getWearablesConfigWearables(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) external view returns (uint256[EQUIPPED_WEARABLE_SLOTS] memory wearables) {
        require(LibWearablesConfig._wearablesConfigExists(_owner, _tokenId, _wearablesConfigId), "WearablesConfigFacet: invalid id, WearablesConfig not found");
        return s.ownersWearableConfigs[_owner][_tokenId].wearableConfigs[_wearablesConfigId].wearables;
    }

    function getAavegtochiWearablesConfigCount(address _owner, uint256 _tokenId) external view returns (uint256 slotsUsed) {
        return s.ownersWearableConfigs[_owner][_tokenId].slotsUsed;
    }
}
