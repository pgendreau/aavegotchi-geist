/* global ethers hre */

import { ethers } from "hardhat";
import { bridgeConfig } from "./bridgeConfig";

export default async function main() {
  const slug = "GOTCHI";
  let diamondAddress = bridgeConfig[63157][slug].MintableToken;

  const accounts = await ethers.getSigners();
  const signer = accounts[0];

  const gotchi = await ethers.getContractAt(
    "AavegotchiGameFacet",
    diamondAddress,
    signer
  );

  const tx = await gotchi.interact([6018]);
  console.log("tx", tx.hash);
  await tx.wait();
  console.log("gotchi pet");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
