import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  DiamondVerifyTaskArgs,
  stringifyArgs,
} from "../../tasks/verifyContracts";

async function verifyAGCDiamond() {
  const hre: HardhatRuntimeEnvironment = require("hardhat");

  const signer = (await hre.ethers.getSigners())[0];

  const address = "0x443650Be09A02Be6fa79Ba19169A853A33581660";

  // Define the task arguments
  const taskArgs: DiamondVerifyTaskArgs = {
    diamondAddress: address,
    //use raw values here
    diamondConstructorArguments: stringifyArgs([]),
    diamondName: "contracts/WGHST/WGHST.sol:WGHST",
  };

  // Run the mintBadges task
  await hre.run("verifyContracts", taskArgs);
}

// Execute the function if this script is run directly
if (require.main === module) {
  verifyAGCDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { verifyAGCDiamond };
