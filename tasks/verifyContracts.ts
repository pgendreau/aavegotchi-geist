import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface DiamondVerifyTaskArgs {
  diamondAddress?: string;
  diamondConstructorArguments: string;
  diamondName?: string;
  facetAddresses?: string;
}

//this task can be used directly in deployment scripts to deploy newly or already deployed facets, diamonds and normal contracts

task("verifyContracts", "Verifies the contract on BlockScout")
  .addOptionalParam("diamondAddress", "The address of the diamond contract")
  .addParam(
    "diamondConstructorArguments",
    "The constructor arguments of the diamond"
  )
  .addOptionalParam(
    "diamondName",
    "Contract name for the diamond Proxy contract"
  )
  .addOptionalParam("facetAddresses", "The addresses of the facets to verify")
  .setAction(
    async (taskArgs: DiamondVerifyTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const {
        diamondAddress,
        diamondConstructorArguments,
        diamondName,
        facetAddresses,
      } = taskArgs;

      //verify diamond first
      if (diamondAddress) {
        console.log(
          "verifying diamond with constructor args",
          parseArgs(diamondConstructorArguments)
        );
        if (diamondName) {
          try {
            await hre.run("verify:verify", {
              address: diamondAddress,
              constructorArguments: parseArgs(diamondConstructorArguments),
              contract: diamondName,
            });
          } catch (error) {
            console.error(
              `Failed to verify diamond at address: ${diamondAddress}`,
              error
            );
          }
        } else {
          try {
            await hre.run("verify:verify", {
              address: diamondAddress,
              constructorArguments: parseArgs(diamondConstructorArguments),
            });
          } catch (error) {
            console.error(
              `Failed to verify diamond at address: ${diamondAddress}`,
              error
            );
          }
        }
      }
      if (facetAddresses) {
        const facets = parseArgs(facetAddresses);
        console.log("verifying", facets.length, "facets");
        for (const facetAddress of facets) {
          console.log(`verifying facet at address: ${facetAddress}`);
          try {
            await hre.run("verify:verify", {
              address: facetAddress,
              //no constructor for facets
              constructorArguments: [],
            });
          } catch (error) {
            console.error(
              `Failed to verify facet at address: ${facetAddress}`,
              error
            );
          }

          console.log(`Waiting 10 seconds before verifying the next facet...`);
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      }
    }
  );

export function stringifyArgs(args: any[]): string {
  return JSON.stringify(args);
}

export function parseArgs(args: string): any[] {
  return JSON.parse(args);
}
