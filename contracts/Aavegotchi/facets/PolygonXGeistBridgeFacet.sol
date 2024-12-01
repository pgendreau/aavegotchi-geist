// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {Aavegotchi, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {LibERC721} from "../../shared/libraries/LibERC721.sol";
import {INFTBridge} from "../../shared/interfaces/INFTBridge.sol";
import {ItemType} from "../libraries/LibItems.sol";
import {ItemsFacet} from "../facets/ItemsFacet.sol";

contract PolygonXGeistBridgeFacet is Modifiers {
    event GotchiGeistBridgeUpdate(address _newBridge);
    event ItemGeistBridgeUpdate(address _newBridge);

    function getGotchiGeistBridge() external view returns (address) {
        return s.gotchGeistBridge;
    }

    function getItemGeistBridge() external view returns (address) {
        return s.itemGeistBridge;
    }

    ///@notice Allow the DAO to update an address as a Geist bridge of the gotchi
    ///@param _newBridge The address to be update as a bridge
    function setGotchiGeistBridge(address _newBridge) external onlyDaoOrOwner {
        s.gotchGeistBridge = _newBridge;
        emit GotchiGeistBridgeUpdate(_newBridge);
    }

    ///@notice Allow the DAO to update an address as a Geist bridge of the items
    ///@param _newBridge The address to be update as a bridge
    function setItemGeistBridge(address _newBridge) external onlyDaoOrOwner {
        s.itemGeistBridge = _newBridge;
        emit ItemGeistBridgeUpdate(_newBridge);
    }

    function bridgeGotchi(address _receiver, uint256 _tokenId, uint256 _msgGasLimit, address _connector) external payable {
        require(s.gotchGeistBridge != address(0), "PolygonXGeistBridgeFacet: Geist bridge not set");
        require(s.itemGeistBridge != address(0), "PolygonXGeistBridgeFacet: Item bridge not set");

        Aavegotchi memory _aavegotchi = s.aavegotchis[_tokenId];

        for (uint256 slot; slot < _aavegotchi.equippedWearables.length; slot++) {
            uint256 wearableId = _aavegotchi.equippedWearables[slot];

            if (wearableId != 0) {
                ItemType memory item = ItemsFacet(address(this)).getItemType(wearableId);
                //items that cannot be transferred can be bridged safely
                if (!item.canBeTransferred) continue;
                else revert("PolygonXGeistBridgeFacet: Cannot bridge with wearable");
            }
        }

        bytes memory _metadata = abi.encode(_aavegotchi);
        INFTBridge(s.gotchGeistBridge).bridge{value: msg.value}(
            _receiver,
            msg.sender,
            _tokenId,
            1,
            _msgGasLimit,
            _connector,
            _metadata,
            new bytes(0)
        );
    }

    function setMetadata(uint _tokenId, bytes memory _metadata) external onlyGotchiGeistBridge {
        Aavegotchi memory _aavegotchi = abi.decode(_metadata, (Aavegotchi));
        s.aavegotchis[_tokenId] = _aavegotchi;
    }

    function mint(address _to, uint _tokenId) external onlyGotchiGeistBridge {
        s.aavegotchis[_tokenId].owner = _to;
        s.tokenIds.push(uint32(_tokenId));
        s.ownerTokenIdIndexes[_to][_tokenId] = s.ownerTokenIds[_to].length;
        s.ownerTokenIds[_to].push(uint32(_tokenId));
        emit LibERC721.Transfer(address(0), _to, _tokenId);
    }

    function burn(address _from, uint _tokenId) external onlyGotchiGeistBridge {
        // burn items before burn gotchi
        Aavegotchi memory _aavegotchi = s.aavegotchis[_tokenId];

        // burn gotchi
        _aavegotchi.owner = address(0);
        uint256 index = s.ownerTokenIdIndexes[_from][_tokenId];
        uint256 lastIndex = s.ownerTokenIds[_from].length - 1;
        if (index != lastIndex) {
            uint32 lastTokenId = s.ownerTokenIds[_from][lastIndex];
            s.ownerTokenIds[_from][index] = lastTokenId;
            s.ownerTokenIdIndexes[_from][lastTokenId] = index;
        }
        s.ownerTokenIds[_from].pop();
        delete s.ownerTokenIdIndexes[_from][_tokenId];

        // delete token approval if any
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
            emit LibERC721.Approval(_from, address(0), _tokenId);
        }

        emit LibERC721.Transfer(_from, address(0), _tokenId);

        // delete aavegotchi info
        string memory name = _aavegotchi.name;
        if (bytes(name).length > 0) {
            delete s.aavegotchiNamesUsed[LibAavegotchi.validateAndLowerName(name)];
        }
        delete s.aavegotchis[_tokenId];
    }
}
