import { ethers } from "hardhat";
import { AavegotchiFacet } from "../../typechain";

async function queryAavegotchiAtBlock() {
  const signer = await (await ethers.getSigners())[0];

  const diamond = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    "0x226625C1B1174e7BaaE8cDC0432Db0e2ED83b7Ba",
    signer
  )) as AavegotchiFacet;

  try {
    const aavegotchis = await diamond.getAavegotchi("1");

    console.log(aavegotchis);
  } catch (error) {
    console.error("Error querying Aavegotchi contract:", error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    await queryAavegotchiAtBlock();
  } catch (error) {
    console.error("Failed to query Aavegotchis:", error);
  }
}

main();
