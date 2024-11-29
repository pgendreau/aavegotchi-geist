/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
import { bridgeConfig } from "./bridgeConfig";

export default async function main() {
  let diamondAddress;
  let gotchiBridgeAddress;

  const slug = "GOTCHI";

  if (network.name === "baseSepolia") {
    diamondAddress = bridgeConfig[84532][slug].NonMintableToken;
    gotchiBridgeAddress = bridgeConfig[84532][slug].Vault;
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
    // TODO: Set production bridge addresses
    gotchiBridgeAddress = "";
  } else if (network.name === "polter") {
    diamondAddress = bridgeConfig[631571][slug].MintableToken;
    gotchiBridgeAddress = bridgeConfig[631571][slug].Controller;
  } else if (network.name === "geist") {
    diamondAddress = bridgeConfig[63157][slug].MintableToken;
    gotchiBridgeAddress = bridgeConfig[63157][slug].Controller;
  } else {
    throw Error("No network settings for " + network.name);
  }

  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const gasPrice = 100000000000;

  const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress);

  const gotchiBridge = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress,
    signer
  );

  const currentGotchiBridge = await gotchiBridge.getGotchiGeistBridge();

  if (currentGotchiBridge === gotchiBridgeAddress) {
    console.log("Bridges are already set");
    return;
  }

  console.log("Setting Gotchi Bridge address:", gotchiBridgeAddress);
  const tx1 = await daoFacet.updateGotchiGeistBridge(gotchiBridgeAddress, {
    gasPrice,
  });
  await tx1.wait();
  console.log("Gotchi Bridge set");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
