// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibItems} from "../libraries/LibItems.sol";
import {LibAppStorage, AppStorage, WearablesConfig, ItemType, EQUIPPED_WEARABLE_SLOTS} from "../libraries/LibAppStorage.sol";

library LibWearablesConfig {

    function _getNextWearablesConfigId(address _owner, uint256 _tokenId) internal view returns (uint256 nextWearablesConfigId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // slots start at 0 so slotsUsed is always the next config id
        nextWearablesConfigId = s.ownerGotchiSlotsUsed[_owner][_tokenId];
    }

    function _wearablesConfigExists(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) internal view returns (bool exists) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        // slots start at 0 so slots used should always be greater by 1 than the last config id
        exists = (s.ownerGotchiSlotsUsed[_owner][_tokenId] > _wearablesConfigId);
    }

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
