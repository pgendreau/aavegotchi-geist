/* global ethers */

import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { ethers, network } from "hardhat";

const { getCollaterals } = require("../scripts/collateralTypes.js");

async function main() {
  const diamondAddress = "0x226625C1B1174e7BaaE8cDC0432Db0e2ED83b7Ba";
  const sepoliaGhstAddress = "0xe97f36a00058AA7DfC4E85d23532C3f70453a7aE";

  let signer;
  let tx;
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else if (network.name === "polter") {
    signer = (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }

  // Add collateral types for H1

  if (testing) {
    const itemManagerDaoFacet = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    );

    collateralFacet = await ethers.getContractAt(
      "CollateralFacet",
      diamondAddress
    );

    const collaterals = await collateralFacet.getAllCollateralTypes();
    console.log("all collaterals:", collaterals);

    let h1collaterals = await collateralFacet.collaterals("1");
    console.log("h1 before adding:", h1collaterals);

    tx = await itemManagerDaoFacet.addCollateralTypes(
      1,
      getCollaterals("matic", ghstAddress)
    );
  } else {
    const daoFacet = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    );
    tx = await daoFacet.addCollateralTypes(
      1,
      getCollaterals("matic", ghstAddress)
    );
  }
  console.log("Adding Collateral Types for H1 tx:", tx.hash);
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding Collateral Types for H1 failed: ${tx.hash}`);
  }

  h1collaterals = await collateralFacet.collaterals("1");
  console.log("h1 after adding:", h1collaterals);

  return {
    signer,
    diamondAddress,
    ghstAddress,
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeHauntCollateralTypes = main;
