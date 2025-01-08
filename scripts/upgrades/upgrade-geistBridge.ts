import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { bridgeConfig } from "../geistBridge/bridgeConfig";
import { PolygonXGeistBridgeFacetInterface } from "../../typechain/PolygonXGeistBridgeFacet";
import { PolygonXGeistBridgeFacet__factory } from "../../typechain";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "PolygonXGeistBridgeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  // const iface = new ethers.utils.Interface(
  //   PolygonXGeistBridgeFacet__factory.abi
  // ) as PolygonXGeistBridgeFacetInterface;
  // const payload = iface.encodeFunctionData("setItemGeistBridge", [
  //   bridgeConfig[63157].GOTCHI_ITEM.Controller,
  // ]);

  const args: DeployUpgradeTaskArgs = {
    diamondOwner: "0x3a2E7D1E98A4a051B0766f866237c73643fDF360", // polter-testnet
    diamondAddress: bridgeConfig[63157].GOTCHI.MintableToken,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    // initAddress: bridgeConfig[63157].GOTCHI.MintableToken,
    // initCalldata: payload,
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
