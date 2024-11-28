/* global ethers */

import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { ethers, network } from "hardhat";
import { getCollaterals } from "../data/airdrops/collaterals/collateralTypes";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { networkAddresses } from "../helpers/constants";

async function main() {
  const diamondAddress = "0x226625C1B1174e7BaaE8cDC0432Db0e2ED83b7Ba";
  const diamondOwner = "0xd38Df837a1EAd12ee16f8b8b7E5F58703f841668";

  // await mine();

  let signer;
  let tx;
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondOwner],
    });
    signer = await ethers.provider.getSigner(diamondOwner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else if (network.name === "polter") {
    signer = (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const collateralFacet = await ethers.getContractAt(
    "CollateralFacet",
    diamondAddress,
    signer
  );

  // Add collateral types for H1

  // if (testing) {
  const itemManagerDaoFacet = await ethers.getContractAt(
    "DAOFacet",
    diamondAddress,
    signer
  );

  const svgFacet = await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  );

  const collaterals = await collateralFacet.getAllCollateralTypes();
  console.log("all collaterals:", collaterals);

  //sepolia
  const ghstAddress = networkAddresses[84532].wghst;

  const aavegotchiSvg = await svgFacet.getAavegotchiSvg("1");

  console.log("aavegotchiSvg:", aavegotchiSvg);

  //get the svg of the Gotchi before setting

  let h1collaterals = await collateralFacet.collaterals("1");
  console.log("h1 before adding:", h1collaterals);

  // return;

  tx = await itemManagerDaoFacet.addCollateralTypes(
    1,
    getCollaterals("baseSepolia", ghstAddress)
  );

  const aavegotchiSvgAfter = await svgFacet.getAavegotchiSvg("1");
  console.log("aavegotchiSvgAfter:", aavegotchiSvgAfter);
}

// return;

// else {
//   const daoFacet = await ethers.getContractAt(
//     "DAOFacet",
//     diamondAddress,
//     signer
//   );
//   tx = await daoFacet.addCollateralTypes(
//     1,
//     getCollaterals("polter", ghstAddress)
//   );
// }
// console.log("Adding Collateral Types for H1 tx:", tx.hash);
// let receipt = await tx.wait();
// if (!receipt.status) {
//   throw Error(`Adding Collateral Types for H1 failed: ${tx.hash}`);
// }

// h1collaterals = await collateralFacet.collaterals("1");
// console.log("h1 after adding:", h1collaterals);

// return {
//   signer,
//   diamondAddress,
//   ghstAddress,
// };
// }

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeHauntCollateralTypes = main;
