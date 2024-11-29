/* global ethers hre */

import { ethers, network } from "hardhat";
import { bridgeConfig } from "./bridgeConfig";

export default async function main() {
  let diamondAddress;
  let controllerAddress = "";

  const slug = "GOTCHI";

  if (network.name === "polter") {
    diamondAddress = bridgeConfig[631571][slug].MintableToken;
    controllerAddress = bridgeConfig[631571][slug].Controller;
  } else if (network.name === "geist") {
    diamondAddress = bridgeConfig[63157][slug].MintableToken;
    controllerAddress = bridgeConfig[63157][slug].Controller;
  } else {
    throw Error("No network settings for " + network.name);
  }

  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const gasPrice = 100000000000;

  const gotchiBridge = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress,
    signer
  );

  // const currexntItemBridge = await gotchiBridge.gewe();

  // if (
  //   currentGotchiBridge === gotchiBridgeAddress
  //   // currentItemBridge === itemBridgeAddress
  // ) {
  //   console.log("Bridges are already set");
  //   return;
  // }

  // if (currentGotchiBridge !== gotchiBridgeAddress) {
  console.log("Setting Item Bridge address:", controllerAddress);
  const tx1 = await gotchiBridge.setItemGeistBridge(controllerAddress, {
    gasPrice,
  });
  await tx1.wait();
  console.log("Item Bridge set");
}

// if (currentItemBridge !== itemBridgeAddress) {
//   console.log("Setting Item Bridge address:", itemBridgeAddress);
//   const tx2 = await daoFacet.updateItemGeistBridge(itemBridgeAddress, {
//     gasPrice,
//   });
//   await tx2.wait();
//   console.log("Item Bridge set");
// }
// }

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
