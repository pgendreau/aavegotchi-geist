// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibAppStorage, AppStorage, WearablesConfig} from "../libraries/LibAppStorage.sol";

library LibWearablesConfig {

    function _getNewWearablesConfigId(address _owner, uint256 _tokenId) internal view returns (uint256 wearablesConfigId) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        wearablesConfigId = uint256(s.ownersWearableConfigs[_owner][_tokenId].slotsUsed + 1);
    }

    function _wearablesConfigExists(address _owner, uint256 _tokenId, uint256 _wearablesConfigId) internal view returns (bool exists) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        exists = (s.ownersWearableConfigs[_owner][_tokenId].slotsUsed >= _wearablesConfigId);
    }

} 
