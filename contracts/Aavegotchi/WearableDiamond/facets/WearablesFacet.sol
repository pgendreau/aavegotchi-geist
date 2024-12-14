// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {PeripheryFacet} from "../../facets/PeripheryFacet.sol";
import {LibEventHandler} from "../libraries/LibEventHandler.sol";
import {WearableLibDiamond} from "../libraries/WearableLibDiamond.sol";
import {LibStrings} from "../../../shared/libraries/LibStrings.sol";

import {ItemsFacet} from "../../facets/ItemsFacet.sol";
import {AavegotchiFacet} from "../../facets/AavegotchiFacet.sol";
import {INFTBridge} from "../../../shared/interfaces/INFTBridge.sol";

contract WearablesFacet {
    event ItemGeistBridgeUpdate(address _newBridge);

    function name() external pure returns (string memory) {
        return "Aavegotchi Items";
    }

    function symbol() external pure returns (string memory) {
        return "ITEMS";
    }

    function periphery() internal view returns (PeripheryFacet pFacet) {
        pFacet = PeripheryFacet(WearableLibDiamond.aavegotchiDiamond());
    }

    function itemsFacet() internal view returns (ItemsFacet iFacet) {
        iFacet = ItemsFacet(WearableLibDiamond.aavegotchiDiamond());
    }

    function aavegotchiFacet() internal view returns (AavegotchiFacet aFacet) {
        aFacet = AavegotchiFacet(WearableLibDiamond.aavegotchiDiamond());
    }

    //READ

    function balanceOf(address _owner, uint256 _id) external view returns (uint256 balance_) {
        balance_ = itemsFacet().balanceOf(_owner, _id);
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory bals) {
        bals = itemsFacet().balanceOfBatch(_owners, _ids);
    }

    function uri(uint256 _id) external view returns (string memory) {
        return itemsFacet().uri(_id);
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_) {
        approved_ = aavegotchiFacet().isApprovedForAll(_owner, _operator);
    }

    // function tokenURI(uint256 _tokenId) external view returns (string memory) {
    //     return aavegotchiFacet().tokenURI(_tokenId);
    // }

    //  function contractURI() public view returns (string memory) {
    //     return "https://app.aavegotchi.com/metadata/items/[id]";
    // }

    //WRITE

    function setApprovalForAll(address _operator, bool _approved) external {
        periphery().peripherySetApprovalForAll(_operator, _approved, msg.sender);
        //emit event
        //previous address in frame should be the owner
        LibEventHandler._receiveAndEmitApprovalEvent(msg.sender, _operator, _approved);
    }

    function setBaseURI(string memory _value) external {
        WearableLibDiamond.enforceIsContractOwner();
        uint256 itemLength = periphery().peripherySetBaseURI(_value);
        //emit events
        for (uint256 i; i < itemLength; i++) {
            LibEventHandler._receiveAndEmitUriEvent(LibStrings.strWithUint(_value, i), i);
        }
    }

    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data) external {
        periphery().peripherySafeTransferFrom(msg.sender, _from, _to, _id, _value, _data);
        //emit event
        LibEventHandler._receiveAndEmitTransferSingleEvent(msg.sender, _from, _to, _id, _value);
    }

    function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external {
        periphery().peripherySafeBatchTransferFrom(msg.sender, _from, _to, _ids, _values, _data);
        //emit event
        LibEventHandler._receiveAndEmitTransferBatchEvent(msg.sender, _from, _to, _ids, _values);
    }

    //Bridging

    function setItemGeistBridge(address _itemGeistBridge) external {
        WearableLibDiamond.enforceIsContractOwner();
        WearableLibDiamond.diamondStorage().itemGeistBridge = _itemGeistBridge;
        emit ItemGeistBridgeUpdate(_itemGeistBridge);
    }

    function itemGeistBridge() public view returns (address) {
        return WearableLibDiamond.diamondStorage().itemGeistBridge;
    }

    function bridgeItem(address _receiver, uint256 _tokenId, uint256 _amount, uint256 _msgGasLimit, address _connector) external payable {
        WearableLibDiamond.DiamondStorage storage ds = WearableLibDiamond.diamondStorage();

        INFTBridge(ds.itemGeistBridge).bridge{value: msg.value}(
            _receiver,
            msg.sender,
            _tokenId,
            _amount,
            _msgGasLimit,
            _connector,
            new bytes(0),
            new bytes(0)
        );
    }

    function mint(address _to, uint _tokenId, uint _quantity) external {
        require(msg.sender == WearableLibDiamond.diamondStorage().itemGeistBridge, "WearablesFacet: Only item geist bridge can mint");

        periphery().peripheryBridgeMint(_to, _tokenId, _quantity);

        LibEventHandler._receiveAndEmitTransferSingleEvent(msg.sender, address(0), _to, _tokenId, _quantity);
    }

    function burn(address _from, uint _tokenId, uint _quantity) external {
        require(msg.sender == WearableLibDiamond.diamondStorage().itemGeistBridge, "WearablesFacet: Only item geist bridge can burn");
        periphery().peripheryBridgeBurn(_from, _tokenId, _quantity);
        LibEventHandler._receiveAndEmitTransferSingleEvent(msg.sender, _from, address(0), _tokenId, _quantity);
    }
}
