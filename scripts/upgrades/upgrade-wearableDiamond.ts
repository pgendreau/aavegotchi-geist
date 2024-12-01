import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { bridgeConfig } from "../geistBridge/bridgeConfig";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "WearablesFacet",
      addSelectors: [
        "function name() external pure returns (string memory)",
        "function symbol() external pure returns (string memory)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: "0x3a2E7D1E98A4a051B0766f866237c73643fDF360", // polter-testnet
    diamondAddress: bridgeConfig[63157].GOTCHI_ITEM.MintableToken,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);

  //now try running a bridge

  // const itemBridgeAddress = bridgeConfig[63157]["GOTCHI_ITEM"].MintableToken;

  // const impersonatedSigner = await ethers.getImpersonatedSigner(
  //   "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"
  // );

  // const signer = await (await ethers.getSigners())[0];
  // const itemBridge = await ethers.getContractAt(
  //   "WearablesFacet",
  //   itemBridgeAddress,
  //   impersonatedSigner
  // );

  // const tx = await itemBridge.bridgeItem(
  //   "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5",
  //   "228",
  //   "1",
  //   500_000,
  //   bridgeConfig[63157]["GOTCHI_ITEM"].connectors["137"].FAST
  // );
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
