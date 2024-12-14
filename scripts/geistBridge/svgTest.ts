/* global ethers hre */

import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";

export default async function main() {
  const config = {
    "84532": {
      GOTCHI: {
        isAppChain: false,
        NonMintableToken: "0x87C969d083189927049f8fF3747703FB9f7a8AEd",
        Vault: "0xEccF8B72c6A354532F27053e54A5b4b912D1e6D6",
        connectors: {
          "631571": {
            FAST: "0x3C43820A77d3Ff7Df81f212851857c46684f8b2F",
          },
        },
      },
    },
    "631571": {
      GOTCHI: {
        isAppChain: true,
        MintableToken: "0xD66C6C61D5a535eD69E3769582895daec28a4651",
        Controller: "0x143B8D0e2b6d7791F571A68bf07da2253C0d52CB",
        connectors: {
          "84532": {
            FAST: "0x3A643fc25C721971314119a50a7fdF18385b7eD9",
          },
        },
      },
    },
  };

  let diamondAddress;
  let connector;

  if (network.name === "polter") {
    diamondAddress = config[631571].GOTCHI.MintableToken;
    // controller address
  } else if (network.name === "baseSepolia") {
    diamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd";
  } else if (network.name === "matic") {
    diamondAddress = maticDiamondAddress;
  } else {
    throw Error("No network settings for " + network.name);
  }

  const bridgeFacet = await ethers.getContractAt(
    "PolygonXGeistBridgeFacet",
    diamondAddress
  );
  const aavegotchiFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    diamondAddress
  );
  // const svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress);
  // const daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress);
  // const itemsFacet = await ethers.getContractAt(
  //   "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
  //   diamondAddress
  // );

  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const gasLimit = 1000000;
  const gasPrice = 100000000000;
  let tx;

  // console.log(`Trying to approve to send gotchis/items.`);
  // tx = await aavegotchiFacet.setApprovalForAll(itemBridgeAddress, true)
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()

  const tokenId = 512;
  const aavegotchi = await aavegotchiFacet.getAavegotchi(tokenId);
  console.log("aavegotchi:", aavegotchi);
  // const svgFacet = await ethers.getContractAt("SvgFacet", diamondAddress);
  // const svg = await svgFacet.getAavegotchiSvg(tokenId);

  const svgSideFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress
  );
  const svgSide = await svgSideFacet.getAavegotchiSideSvgs(tokenId);

  console.log("svg:", svgSide);

  console.log("signert:", signer.address);
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
