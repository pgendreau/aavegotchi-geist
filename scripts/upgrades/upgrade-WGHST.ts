import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

export async function upgrade() {
  // const executeERC1155ListingParamsTuple = "tuple(uint256 listingId, address contractAddress, uint256 itemId, uint256 quantity, uint256 priceInWei, address recipient)";
  // const executeERC721ListingParamsTuple = "tuple(uint256 listingId, address contractAddress, uint256 priceInWei, uint256 tokenId, address recipient)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AavegotchiGameFacet",
      addSelectors: [],
      removeSelectors: [
        "function ghstAddress() external view"
      ],
    },
    {
      facetName: "CollateralFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "DAOFacet",
      addSelectors: [
        "function setWGHSTContract(address _wghstContract) external",
        "function getWGHSTContract() external view"
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC1155BuyOrderFacet",
      addSelectors: [
        // "function placeERC1155BuyOrder(address _erc1155TokenAddress, uint256 _erc1155TokenId, uint256 _priceInWei, uint256 _quantity, uint256 _duration) external payable",
      ],
      removeSelectors: [
        // "function placeERC1155BuyOrder(address _erc1155TokenAddress, uint256 _erc1155TokenId, uint256 _priceInWei, uint256 _quantity, uint256 _duration) external",
      ],
    },
    {
      facetName: "ERC1155MarketplaceFacet",
      addSelectors: [
        // "function executeERC1155Listing(uint256 _listingId, uint256 _quantity, uint256 _priceInWei) external payable",
        // "function executeERC1155ListingToRecipient(uint256 _listingId, address _contractAddress, uint256 _itemId, uint256 _quantity, uint256 _priceInWei, address _recipient) external payable",
        // `function batchExecuteERC1155Listing(${executeERC1155ListingParamsTuple}[] calldata listings) external payable`

      ],
      removeSelectors: [
        "function setListingFee(uint256 _listingFeeInWei) external",
        // "function executeERC1155Listing(uint256 _listingId, uint256 _quantity, uint256 _priceInWei) external",
        // "function executeERC1155ListingToRecipient(uint256 _listingId, address _contractAddress, uint256 _itemId, uint256 _quantity, uint256 _priceInWei, address _recipient) external",
        // `function batchExecuteERC1155Listing(${executeERC1155ListingParamsTuple}[] calldata listings) external`
      ],
    },
    {
      facetName: "ERC721BuyOrderFacet",
      addSelectors: [
        // "function placeERC721BuyOrder(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _priceInWei, uint256 _duration, bool[] calldata _validationOptions) external payable"
      ],
      removeSelectors: [
        // "function placeERC721BuyOrder(address _erc721TokenAddress, uint256 _erc721TokenId, uint256 _priceInWei, uint256 _duration, bool[] calldata _validationOptions) external",
      ],
    },
    {
      facetName: "ERC721MarketplaceFacet",
      addSelectors: [
        // "function executeERC721ListingToRecipient(uint256 _listingId, address _contractAddress, uint256 _priceInWei, uint256 _tokenId, address _recipient) external payable",
        // `function batchExecuteERC721Listing(${executeERC721ListingParamsTuple}[] calldata listings) external payable`
      ],
      removeSelectors: [
        // "function executeERC721ListingToRecipient(uint256 _listingId, address _contractAddress, uint256 _priceInWei, uint256 _tokenId, address _recipient) external",
        // `function batchExecuteERC721Listing(${executeERC721ListingParamsTuple}[] calldata listings) external`

      ],
    },
    {
      facetName: "EscrowFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "GotchiLendingFacet",
      addSelectors: [
        // "function agreeGotchiLending(uint32 _listingId, uint32 _erc721TokenId, uint96 _initialCost, uint32 _period, uint8[3] calldata _revenueSplit) external payable",
      ],
      removeSelectors: [
        // "function agreeGotchiLending(uint32 _listingId, uint32 _erc721TokenId, uint96 _initialCost, uint32 _period, uint8[3] calldata _revenueSplit) external",

      ],
    },
    {
      facetName: "ShopFacet",
      addSelectors: [
        // "function purchaseItemsWithGhst(address _to, uint256[] calldata _itemIds, uint256[] calldata _quantities) external payable"
      ],
      removeSelectors: [
        "function buyPortals(address _to, uint256 _ghst) external",
        // "function purchaseItemsWithGhst(address _to, uint256[] calldata _itemIds, uint256[] calldata _quantities) external",
        "function purchaseTransferItemsWithGhst(address _to, uint256[] calldata _itemIds, uint256[] calldata _quantities) external"
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: '0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668', // polter-testnet
    diamondAddress: '0x1F0eb9099b9c398323dcf2F133dFdAD9dE7cF994', // polter-testnet
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
