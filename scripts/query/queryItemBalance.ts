import { ethers } from "hardhat";
import { WearablesFacet } from "../../typechain";
import { bridgeConfig } from "../geistBridge/bridgeConfig";

async function queryAavegotchiAtBlock() {
  const signer = await (await ethers.getSigners())[0];

  const diamondAddress = bridgeConfig[63157]["GOTCHI_ITEM"].MintableToken;
  const tokenId = "228";
  const address = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const itemBridgeAddress = bridgeConfig[63157]["GOTCHI_ITEM"].Controller;
  const expectedDiamondAddress = bridgeConfig[63157]["GOTCHI"].MintableToken;

  const diamond = (await ethers.getContractAt(
    "WearablesFacet",
    diamondAddress,
    signer
  )) as WearablesFacet;

  try {
    const balance = await diamond.balanceOf(address, tokenId);

    const allowance = await diamond.isApprovedForAll(
      address,
      itemBridgeAddress
    );

    const itemBridge = await diamond.itemGeistBridge();

    const diamondAddress = await diamond.aavegotchiDiamond();

    console.log(balance);
    console.log(allowance);
    console.log(itemBridge);
    console.log(expectedDiamondAddress);
    console.log(diamondAddress);
  } catch (error) {
    console.error("Error querying item balance:", error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    await queryAavegotchiAtBlock();
  } catch (error) {
    console.error("Failed to query item balance:", error);
  }
}

main();
