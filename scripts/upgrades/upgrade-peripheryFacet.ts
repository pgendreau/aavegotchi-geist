import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PeripheryFacet",
      addSelectors: [
        "function getWearableDiamond() external view returns (address)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668", // polter-testnet
    diamondAddress: "0x87c969d083189927049f8ff3747703fb9f7a8aed", // polter-testnet
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    // initAddress: ethers.constants.AddressZero,
    // initCalldata: "0x",
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
