import { ethers } from "hardhat";
import { AavegotchiFacet, SvgFacet } from "../../typechain";

async function queryAavegotchiAtBlock() {
  const signer = await (await ethers.getSigners())[0];

  const diamond = (await ethers.getContractAt(
    "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
    "0x6Acc828BbbC6874de40Ca20bfeA7Cd2a2DA8DA8c",
    signer
  )) as AavegotchiFacet;

  try {
    const aavegotchis = await diamond.getAavegotchi("6018");

    console.log(aavegotchis);

    const svgFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/SvgFacet.sol:SvgFacet",
      "0x6Acc828BbbC6874de40Ca20bfeA7Cd2a2DA8DA8c",
      signer
    )) as SvgFacet;
    const svg = await svgFacet.getAavegotchiSvg(6018);
    console.log(svg);
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
