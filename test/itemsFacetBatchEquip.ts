/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-itemsFacet";
import { impersonate, resetChain } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  ItemsFacet,
} from "../typechain";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber, BigNumberish } from "ethers";

const { expect } = chai;

describe("Testing Batch Equip Wearables", async function () {
  this.timeout(300000);

  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d"; // polygon mainnet
  //const diamondAddress = '0x226625C1B1174e7BaaE8cDC0432Db0e2ED83b7Ba'; // polter-testnet
  const wearables = [105, 209, 159, 104, 106, 65, 413, 210, 0, 0, 0, 0, 0, 0, 0, 0];
  const wearablesWithInvalidId = [418, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const wearablesWithInvalidSlot = [104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const emptyWearables = new Array(16).fill(0);
  const aavegotchiId = 4895;
  const rentedOutAavegotchiId = 9121;
  const unsummonedAavegotchiId = 945;
  const someoneElseAavegotchiId = 10356;

  let aavegotchiOwnerAddress: any;
  let anotherAavegotchiOwnerAddress: any;
  let gotchisOfOwner: number[];
  let aavegotchiFacet: AavegotchiFacet;
  let itemsFacetWithOwner: ItemsFacet;

  before(async function () {
    //await resetChain(hre);
    // workaround for issue https://github.com/NomicFoundation/hardhat/issues/5511
    //await helpers.mine()

    //await upgrade();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    const itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )) as ItemsFacet;

    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(aavegotchiId);
    anotherAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(rentedOutAavegotchiId);
    gotchisOfOwner = await aavegotchiFacet.tokenIdsOfOwner(aavegotchiOwnerAddress);

    //const accounts = await ethers.getSigners();
    //const ownerAddress = await accounts[0].getAddress();

    itemsFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network
    );
  });

  describe("Testing batchEquipWearables", async function () {

    async function getWearables(_tokenId: number) : number[] {
      const currentWearables = await itemsFacetWithOwner.equippedWearables(_tokenId);
      return currentWearables;
    }

    it("Should unequip all wearables from multiple gotchis", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [
          4895,
          15434,
          2745,
        ],
        [
          emptyWearables,
          emptyWearables,
          emptyWearables,
        ]
      );
      expect(await getWearables(4895)).to.deep.equal(emptyWearables);
      expect(await getWearables(15434)).to.deep.equal(emptyWearables);
      expect(await getWearables(2745)).to.deep.equal(emptyWearables);
    });
    it("Should be able to unequip and requip the same gotchi", async function () {
      await itemsFacetWithOwner.equipWearables(4895, wearables);
      await itemsFacetWithOwner.batchEquipWearables(
        [
          4895,
          4895
        ],
        [
          emptyWearables,
          wearables,
        ]
      );
      expect(await getWearables(4895)).to.deep.equal(wearables);
    });
    it("Should be able to unequip from one gotchi to equip on the next", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [
          4895,
          2745,
        ],
        [
          emptyWearables,
          wearables,
        ]
      );
      expect(await getWearables(4895)).to.deep.equal(emptyWearables);
      expect(await getWearables(2745)).to.deep.equal(wearables);
    });
    it("Should be able to completely flip wearables between two gotchis", async function () {
      const firstGotchiId = 19553;
      const secondGotchiId = 20848;
      const firstGotchiWearables = await itemsFacetWithOwner.equippedWearables(firstGotchiId);
      const secondGotchiWearables = await itemsFacetWithOwner.equippedWearables(secondGotchiId);
      await itemsFacetWithOwner.batchEquipWearables(
        [
          firstGotchiId,
          secondGotchiId,
          firstGotchiId,
          secondGotchiId,
        ],
        [
          emptyWearables,
          emptyWearables,
          secondGotchiWearables,
          firstGotchiWearables,
        ]
      );
      expect(await getWearables(firstGotchiId)).to.deep.equal(secondGotchiWearables);
      expect(await getWearables(secondGotchiId)).to.deep.equal(firstGotchiWearables);
    });
    it("Should revert if arguments are not the same length", async function () {
      await expect(
        itemsFacetWithOwner.batchEquipWearables(
          [
            4895,
            2745,
          ],
          [
            emptyWearables,
          ]
        )
      ).to.be.revertedWith("ItemsFacet: _wearablesToEquip length not same as _tokenIds length");
    });
  });
});
