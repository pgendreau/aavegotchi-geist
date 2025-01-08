import { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeploymentConfig } from "./deployFullDiamond";
import { ForgeDAOFacet } from "../typechain";
import { ethers } from "hardhat";

async function main() {
  const hre: HardhatRuntimeEnvironment = require("hardhat");
  const forgeDiamondAddress = loadDeploymentConfig(63157)
    .forgeDiamond as string;

  const signer = (await ethers.getSigners())[0];

  // Get contract
  const forgeFacet = (await hre.ethers.getContractAt(
    "ForgeDAOFacet",
    forgeDiamondAddress,
    signer
  )) as ForgeDAOFacet;

  // Pause forge
  const tx = await forgeFacet.pauseContract();
  await tx.wait();

  console.log("Forge has been paused");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
