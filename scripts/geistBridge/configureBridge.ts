/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";
import { AMOY_DIAMOND } from "../../helpers/constants";

export default async function main() {
  const gasPrice = "70000000000";
  let gotchiBridgeAddress;
  let itemBridgeAddress;
  let diamondAddress;
  let tx;
  if (network.name === "polter") { // polter-testnet
    diamondAddress = "0x1F0eb9099b9c398323dcf2F133dFdAD9dE7cF994";
    // controller address
    gotchiBridgeAddress = "0x5ABB7E28160f82A84e389aDcc9d8CE3F7a0C8D92";
    itemBridgeAddress = "0x10Cf0D5C1986a7Aa98aDb3bfa3529c1BBDa59FB9";
  } else if (network.name === "geist") {
    diamondAddress = "";
    // TODO: controller address
    gotchiBridgeAddress = "";
    itemBridgeAddress = "";
  } else {
    throw Error("No network settings for " + network.name);
  }

  const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress);

  console.log(`Configuring gotchi bridge...`);
  tx = await daoFacet.updateGotchiGeistBridge(gotchiBridgeAddress, {
    gasPrice: gasPrice,
  });
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Configuring items bridge...`);
  tx = await daoFacet.updateItemGeistBridge(itemBridgeAddress, {
    gasPrice: gasPrice,
  });
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Bridge configured on ${network.name}.`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;
