// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibAppStorage, AppStorage, WearablesConfig, ItemType, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";

library LibWearablesConfig {

    /// @notice Returns the next wearables config id for that gotchi given that owner
    /// @param _owner The owner of the gotchi
    /// @param _tokenId The tokenId of the gotchi
    /// @return The next free wearables config id
    function _getNextWearablesConfigId(address _owner, uint256 _tokenId) internal view returns (uint256 nextWearablesConfigId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // slots start at 0 so slotsUsed is always the next config id
        nextWearablesConfigId = s.ownerGotchiSlotsUsed[_owner][_tokenId];
    }

    
    /// @notice Checks if a wearables config exists for a gotchi given an owner
    /// @param _owner The owner of the gotchi
    /// @param _tokenId The tokenId of the gotchi
    /// @param _wearablesConfigId The wearables config id
    /// @return True if the wearables config exists false otherwise
    function _wearablesConfigExists(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) internal view returns (bool exists) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // slots start at 0 so slots used should always be greater by 1 than the last config id
        exists = (s.ownerGotchiSlotsUsed[_owner][_tokenId] > _wearablesConfigId);
    }

    /// @notice Checks if a wearables configuration consist of valid wearables and are for the correct slot
    /// @param _wearablesToStore The wearables to store
    /// @return True if the wearables configuration is valid and false otherwise
    function _checkValidWearables(uint256[EQUIPPED_WEARABLE_SLOTS] memory _wearablesToStore) internal view returns (bool valid) {
        bool valid = true;
        AppStorage storage s = LibAppStorage.diamondStorage();
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            uint256 toStoreId = _wearablesToStore[slot];
            if (toStoreId != 0) {
                ItemType storage itemType = s.itemTypes[toStoreId];
                if (itemType.category != LibItems.ITEM_CATEGORY_WEARABLE) {
                  valid = false;
                  break;
                }
                if (itemType.slotPositions[slot] == false) {
                  valid = false;
                  break;
                }
            }
        }
        return valid;
    }
}
