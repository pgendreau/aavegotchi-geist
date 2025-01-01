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
  const wearablesWithRentals = [222, 146, 117, 147, 6, 148, 151, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
  const depositIdsOfWearableRentals = [0, 384, 385, 1393, 380, 382, 383, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const emptyWearables = new Array(16).fill(0);
  const aavegotchiId = 4895;
  const wearablesRentalAavegotchiId = 3166;

  let aavegotchiOwnerAddress: any;
  let anotherAavegotchiOwnerAddress: any;
  let gotchisOfOwner: number[];
  let aavegotchiFacet: AavegotchiFacet;
  let itemsFacetWithOwner: ItemsFacet;
  let itemsFacetWithOtherOwner: ItemsFacet;

  before(async function () {
    await resetChain(hre);
    // workaround for issue https://github.com/NomicFoundation/hardhat/issues/5511
    await helpers.mine()

    await upgrade();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    const itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )) as ItemsFacet;

    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(aavegotchiId);
    anotherAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(wearablesRentalAavegotchiId);
    gotchisOfOwner = await aavegotchiFacet.tokenIdsOfOwner(aavegotchiOwnerAddress);

    //const accounts = await ethers.getSigners();
    //const ownerAddress = await accounts[0].getAddress();

    itemsFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network
    );

    itemsFacetWithOtherOwner = await impersonate(
      anotherAavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network
    );
  });

  describe("Testing batch functions to equip wearables", async function () {

    async function getWearables(_tokenId: number) : number[] {
      const currentWearables = await itemsFacetWithOwner.equippedWearables(_tokenId);
      return currentWearables;
    }

    it("Should unequip all wearables from multiple gotchis", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [
          gotchisOfOwner[3],
          gotchisOfOwner[4],
          gotchisOfOwner[5],
        ],
        [
          emptyWearables,
          emptyWearables,
          emptyWearables,
        ]
      );
      expect(await getWearables(gotchisOfOwner[3])).to.deep.equal(emptyWearables);
      expect(await getWearables(gotchisOfOwner[4])).to.deep.equal(emptyWearables);
      expect(await getWearables(gotchisOfOwner[5])).to.deep.equal(emptyWearables);
    });
    it("Should be able to unequip and requip the same gotchi", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [
          aavegotchiId,
          aavegotchiId,
        ],
        [
          emptyWearables,
          wearables,
        ]
      );
      expect(await getWearables(aavegotchiId)).to.deep.equal(wearables);
    });
    it("Should be able to unequip from one gotchi to equip on the next", async function () {
      // use H1 gotchis because of background
      await itemsFacetWithOwner.batchEquipWearables(
        [
          gotchisOfOwner[2],
          gotchisOfOwner[9],
        ],
        [
          emptyWearables,
          wearables,
        ]
      );
      expect(await getWearables(gotchisOfOwner[2])).to.deep.equal(emptyWearables);
      expect(await getWearables(gotchisOfOwner[9])).to.deep.equal(wearables);
    });
    it("Should be able to completely flip wearables between two gotchis", async function () {
      const firstGotchiId = gotchisOfOwner[13];
      const secondGotchiId = gotchisOfOwner[14];
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
    it("Should unequip and requip wearables with rentals ", async function () {
      await itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
        [
          wearablesRentalAavegotchiId,
          wearablesRentalAavegotchiId,
        ],
        [
          emptyWearables,
          wearablesWithRentals,
        ],
        [
          emptyWearables,
          depositIdsOfWearableRentals,
        ]
      );
      expect(await getWearables(wearablesRentalAavegotchiId)).to.deep.equal(wearablesWithRentals);
    });
    it("Should revert if arguments are not all the same length ", async function () {
      await expect(
        itemsFacetWithOwner.batchEquipWearables(
          [
            gotchisOfOwner[2],
            gotchisOfOwner[9],
          ],
          [
            emptyWearables,
          ]
        )
      ).to.be.revertedWith("ItemsFacet: _wearablesToEquip length not same as _tokenIds length");
      await expect(
        itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
          [
            wearablesRentalAavegotchiId,
            wearablesRentalAavegotchiId,
          ],
          [
            emptyWearables,
          ],
          [
            emptyWearables,
            emptyWearables,
          ]
        )
      ).to.be.revertedWith("ItemsFacet: _wearablesToEquip length not same as _tokenIds length");
      await expect(
        itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
          [
            wearablesRentalAavegotchiId,
            wearablesRentalAavegotchiId,
          ],
          [
            emptyWearables,
            emptyWearables,
          ],
          [
            emptyWearables,
          ]
        )
      ).to.be.revertedWith("ItemsFacet: _depositIds length not same as _tokenIds length");
    });
  });
});
