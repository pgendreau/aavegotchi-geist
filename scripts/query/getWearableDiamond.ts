import { ethers } from "hardhat";
import { PeripheryFacet } from "../../typechain";

async function getWearableDiamond() {
  // Periphery diamond address on testnet
  const diamondAddress = "0x87c969d083189927049f8ff3747703fb9f7a8aed";

  // Get periphery facet
  const peripheryFacet = (await ethers.getContractAt(
    "PeripheryFacet",
    diamondAddress
  )) as PeripheryFacet;

  try {
    // Query wearable diamond address
    const wearableDiamondAddress = await peripheryFacet.getWearableDiamond();
    console.log("Wearable Diamond Address:", wearableDiamondAddress);
    return wearableDiamondAddress;
  } catch (error) {
    console.error("Error getting wearable diamond address:", error);
    throw error;
  }
}

if (require.main === module) {
  getWearableDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { getWearableDiamond };
