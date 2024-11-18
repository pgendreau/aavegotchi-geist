import { ethers } from "hardhat";
import { AavegotchiFacet } from "../../typechain";

async function queryAavegotchiAtBlock() {
  const signer = await (await ethers.getSigners())[0];

  const diamond = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    "0x8045C27B29569eA6AcF39BF7B139f31c00b56467",
    signer
  )) as AavegotchiFacet;

  try {
    const aavegotchis = await diamond.getAavegotchi(506);

    console.log(aavegotchis);
  } catch (error) {
    console.error("Error querying Aavegotchi contract:", error);
    throw error;
  }
}

// Example usage
async function main() {
  const BLOCK_NUMBER = 4610;

  try {
    await queryAavegotchiAtBlock();
  } catch (error) {
    console.error("Failed to query Aavegotchis:", error);
  }
}

main();
