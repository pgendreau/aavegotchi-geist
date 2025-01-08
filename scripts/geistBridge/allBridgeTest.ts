/* global ethers hre */

import { ethers } from "hardhat";
import _ from 'lodash';

function delay(minute: number) {
  return new Promise(resolve => setTimeout(resolve, minute * 60000));
}

export default async function main() {
  const bsProvider = new ethers.providers.JsonRpcProvider(process.env.BASE_SEPOLIA_URL);
  const polterProvider = new ethers.providers.JsonRpcProvider(process.env.POLTER_TESTNET_URL);
  const bsSigner = new ethers.Wallet(`0x${process.env.SECRET}`, bsProvider);
  const polterSigner = new ethers.Wallet(`0x${process.env.SECRET}`, polterProvider);
  const signerAddress = polterSigner.address;

  // Base-Sepolia configurations
  const bsDiamondAddress = "0x87C969d083189927049f8fF3747703FB9f7a8AEd"
  const bsGotchiBridgeAddress = "0x110A646276961C2d8a54b951bbC8B169E0F573c4"  // vault address
  const bsGotchiConnectorAddress = "0xd912F40C27E317db2334e210de892e9dc92816af"
  const bsItemBridgeAddress = "0x130119B300049A80C20B2D3bfdFCfd021373E5e7"
  const bsItemConnectorAddress = "0xb8388b23222876FAC04b464fA0d6A064c67A14FC"
  const bsBridgeFacet = await ethers.getContractAt("PolygonXGeistBridgeFacet", bsDiamondAddress, bsSigner)
  const bsAavegotchiFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", bsDiamondAddress, bsSigner)

  // Polter configurations
  const polDiamondAddress = "0x1F0eb9099b9c398323dcf2F133dFdAD9dE7cF994"
  const polGotchiBridgeAddress = "0x5ABB7E28160f82A84e389aDcc9d8CE3F7a0C8D92"   // controller address
  const polGotchiConnectorAddress = "0xE7af5160334aded39DD9826cBcBa0B51A1B184e9"
  const polItemBridgeAddress = "0x10Cf0D5C1986a7Aa98aDb3bfa3529c1BBDa59FB9"
  const polItemConnectorAddress = "0x27fA28c1f241E5dEA9AA583751E5D968a28FD9D5"
  const polBridgeFacet = await ethers.getContractAt("PolygonXGeistBridgeFacet", polDiamondAddress, polterSigner)
  const polAavegotchiFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet", polDiamondAddress, polterSigner)
  const polItemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", polDiamondAddress, polterSigner)

  const gasLimit = 2000000;
  const gasPrice = 100000000000;

  const closedPortalId = 10
  const openPortalId = 57
  const nakedGotchiId = 101
  const equipGotchiId = 109
  const itemId = 27
  const equipItemIds = [15, 13, 14, 10, 29, 12, 151, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  let tx;
  let bsTokens: any = {}
  let polTokens: any = {}

  console.log(`Bridging closed portal, open portal and equipped Gotchi...\n\n`);
  const tokenIds = [closedPortalId, openPortalId, equipGotchiId]

  console.log(`Base Sepolia -> Polter\n`);

  for (let tokenId of tokenIds) {
    const gotchi = await bsAavegotchiFacet.getAavegotchi(tokenId)
    // console.log(`Gotchi id: ${tokenId}, gotchi: ${gotchi}`)
    bsTokens[tokenId] = gotchi

    console.log(`Trying to approve to send a gotchi. Token Id: ${tokenId}`);
    tx = await bsAavegotchiFacet.approve(bsGotchiBridgeAddress, tokenId)
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
    await tx.wait()

    console.log(`Trying to bridge a gotchi. Token Id:${tokenId}`);
    tx = await bsBridgeFacet.bridgeGotchi(signerAddress, tokenId, gasLimit, bsGotchiConnectorAddress, {gasPrice: gasPrice})
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
    await tx.wait()
  }

  console.log(`Wait for bridging for 5 minutes...`);
  await delay(5);

  console.log(`Checking bridge result (Base Sepolia -> Polter)\n`);
  for (let tokenId of tokenIds) {
    const gotchi = await polAavegotchiFacet.getAavegotchi(tokenId)
    // console.log(`Gotchi id: ${tokenId}, gotchi: ${gotchi}`)
    polTokens[tokenId] = gotchi
    if((bsTokens[tokenId].baseRarityScore.toNumber() === gotchi.baseRarityScore.toNumber()) && (signerAddress.toLowerCase() === gotchi.owner.toLowerCase())){
      console.log(`Bridging success. gotchi id: ${tokenId}`);
    } else {
      throw Error(`Bridging failed. gotchi id: ${tokenId}`);
    }
  }

  console.log(`Polter -> Base Sepolia\n`);

  for (let tokenId of tokenIds) {
    console.log(`Trying to approve to send a gotchi. Token Id: ${tokenId}`);
    tx = await polAavegotchiFacet.approve(polGotchiBridgeAddress, tokenId)
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
    await tx.wait()

    console.log(`Trying to bridge a gotchi. Token Id:${tokenId}`);
    tx = await polBridgeFacet.bridgeGotchi(signerAddress, tokenId, gasLimit, polGotchiConnectorAddress, {gasPrice: gasPrice})
    console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
    await tx.wait()
  }

  console.log(`Wait for bridging for 5 minutes...`);
  await delay(5);

  console.log(`Checking bridge result (Polter -> Base Sepolia)\n`);
  for (let tokenId of tokenIds) {
    const gotchi = await bsAavegotchiFacet.getAavegotchi(tokenId)
    // console.log(`Gotchi id: ${tokenId}, gotchi: ${gotchi}`)
    if((polTokens[tokenId].baseRarityScore.toNumber() === gotchi.baseRarityScore.toNumber()) && (signerAddress.toLowerCase() === gotchi.owner.toLowerCase())){
      console.log(`Bridging success. gotchi id: ${tokenId}`);
    } else {
      throw Error(`Bridging failed. gotchi id: ${tokenId}`);
    }
  }

  // console.log(`Bridging gotchis with batch function...\n\n`);
  // const gotchiBridgeParams = [
  //   {receiver: signerAddress, tokenId: tokenIds[0], msgGasLimit: gasLimit},
  //   {receiver: signerAddress, tokenId: tokenIds[1], msgGasLimit: gasLimit},
  //   // {receiver: signerAddress, tokenId: tokenIds[2], msgGasLimit: gasLimit},
  // ]
  //
  // console.log(`Base Sepolia -> Polter\n`);
  //
  // for (let tokenId of tokenIds) {
  //   const gotchi = await bsAavegotchiFacet.getAavegotchi(tokenId)
  //   // console.log(`Gotchi id: ${tokenId}, gotchi: ${gotchi}`)
  //   bsTokens[tokenId] = gotchi
  //
  //   console.log(`Trying to approve to send a gotchi. Token Id: ${tokenId}`);
  //   tx = await bsAavegotchiFacet.approve(bsGotchiBridgeAddress, tokenId)
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  //   await tx.wait()
  // }
  // console.log(`Trying to bridge gotchis...`);
  // tx = await bsBridgeFacet.bridgeGotchis(gotchiBridgeParams, bsGotchiConnectorAddress, {gasPrice: gasPrice})
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()
  //
  // console.log(`Wait for bridging for 5 minutes...`);
  // await delay(5);
  //
  // console.log(`Checking bridge result (Base Sepolia -> Polter)\n`);
  // for (let tokenId of tokenIds) {
  //   const gotchi = await polAavegotchiFacet.getAavegotchi(tokenId)
  //   // console.log(`Gotchi id: ${tokenId}, gotchi: ${gotchi}`)
  //   polTokens[tokenId] = gotchi
  //   if((bsTokens[tokenId].baseRarityScore.toNumber() === gotchi.baseRarityScore.toNumber()) && (signerAddress.toLowerCase() === gotchi.owner.toLowerCase())){
  //     console.log(`Bridging success. gotchi id: ${tokenId}`);
  //   } else {
  //     throw Error(`Bridging failed. gotchi id: ${tokenId}`);
  //   }
  // }
  //
  // console.log(`Polter -> Base Sepolia\n`);
  //
  // for (let tokenId of tokenIds) {
  //   console.log(`Trying to approve to send a gotchi. Token Id: ${tokenId}`);
  //   tx = await polAavegotchiFacet.approve(polGotchiBridgeAddress, tokenId)
  //   console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  //   await tx.wait()
  //
  // }
  // console.log(`Trying to bridge gotchis...`);
  // tx = await polBridgeFacet.bridgeGotchis(gotchiBridgeParams, polGotchiConnectorAddress, {gasPrice: gasPrice})
  // console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  // await tx.wait()
  //
  // console.log(`Wait for bridging for 5 minutes...`);
  // await delay(5);
  //
  // console.log(`Checking bridge result (Polter -> Base Sepolia)\n`);
  // for (let tokenId of tokenIds) {
  //   const gotchi = await bsAavegotchiFacet.getAavegotchi(tokenId)
  //   // console.log(`Gotchi id: ${tokenId}, gotchi: ${gotchi}`)
  //   if((polTokens[tokenId].baseRarityScore.toNumber() === gotchi.baseRarityScore.toNumber()) && (signerAddress.toLowerCase() === gotchi.owner.toLowerCase())){
  //     console.log(`Bridging success. gotchi id: ${tokenId}`);
  //   } else {
  //     throw Error(`Bridging failed. gotchi id: ${tokenId}`);
  //   }
  // }

  console.log(`Bridging item itself...\n\n`);

  console.log(`Base Sepolia -> Polter\n`);

  console.log(`Trying to approve to send items.`);
  tx = await bsAavegotchiFacet.setApprovalForAll(bsItemBridgeAddress, true)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bsBridgeFacet.bridgeItem(signerAddress, itemId, 2, gasLimit, bsItemConnectorAddress, {gasPrice: gasPrice})
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log(`Wait for bridging for 5 minutes...`);
  await delay(5);

  console.log(`Polter -> Base Sepolia\n`);

  console.log(`Trying to approve to send items.`);
  tx = await polAavegotchiFacet.setApprovalForAll(polItemBridgeAddress, true)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await polBridgeFacet.bridgeItem(signerAddress, itemId, 2, gasLimit, polItemConnectorAddress, {gasPrice: gasPrice})
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()


  console.log(`Bridging equipped aavegotchi (Base Sepolia -> Polter) ...\n\n`);

  // const bsGotchi = await bsAavegotchiFacet.getAavegotchi(equipGotchiId)
  // console.log(`Gotchi id: ${equipGotchiId}, gotchi: ${bsGotchi}`)

  console.log(`Trying to approve to send a equipped gotchi. Token Id: ${equipGotchiId}`);
  tx = await bsAavegotchiFacet.approve(bsGotchiBridgeAddress, equipGotchiId)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log(`Trying to bridge a equipped gotchi. Token Id:${equipGotchiId}`);
  tx = await bsBridgeFacet.bridgeGotchi(signerAddress, equipGotchiId, gasLimit, bsGotchiConnectorAddress, {gasPrice: gasPrice})
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log(`Wait for bridging for 5 minutes...`);
  await delay(5);

  // console.log(`Checking bridge result (Base Sepolia -> Polter)\n`);
  // const polGotchi = await polAavegotchiFacet.getAavegotchi(equipGotchiId)
  // console.log(`Gotchi id: ${equipGotchiId}, gotchi: ${polGotchi}`)

  console.log(`Checking unequip on Polter \n`);
  tx = await polItemsFacet.equipWearables(equipGotchiId, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log(`Checking equip on Polter \n`);
  tx = await polItemsFacet.equipWearables(equipGotchiId, equipItemIds)
  console.log(`Wating for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()
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
