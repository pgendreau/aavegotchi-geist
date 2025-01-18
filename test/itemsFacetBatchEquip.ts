/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-itemsFacet";
import { impersonate, resetChain } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  WearablesFacet,
  ItemsFacet,
  ItemsRolesRegistryFacet,
} from "../typechain";
import { loadDeploymentConfig } from "../scripts/deployFullDiamond";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import {
  buildCommitment,
  buildGrantRole,
} from "./ItemsRolesRegistryFacet/helpers";

const { expect } = chai;

describe("Testing Batch Equip Wearables", async function () {
  this.timeout(300000);

  const deploymentConfig = loadDeploymentConfig(63157);
  const diamondAddress = deploymentConfig.aavegotchiDiamond as string;
  const wearablesDiamondAddress = deploymentConfig.wearableDiamond as string;
  const wearables = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const otherWearables = [0, 0, 0, 0, 205, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const wearablesWithInvalidId = [
    418, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const wearablesWithInvalidSlot = [
    104, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const wearablesWithRentals = [
    0, 0, 0, 1, 205, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const depositIdsOfWearableRentals = [
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const emptyWearables = new Array(16).fill(0);
  const aavegotchiId = 15748;
  const anotherOwnerAavegotchiId = 19488;
  const anotherWearablesOwner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const nullAddress = ethers.constants.AddressZero;

  let aavegotchiOwnerAddress: any;
  let anotherAavegotchiOwnerAddress: any;
  let gotchisOfOwner: number[];
  let aavegotchiFacet: AavegotchiFacet;
  let wearablesFacet: WearablesFacet;
  let itemsRolesRegistryFacet: ItemsRolesRegistryFacet;
  let aavegotchiFacetWithOwner: AavegotchiFacet;
  let itemsFacetWithOwner: ItemsFacet;
  let wearablesFacetWithOwner: WearablesFacet;
  let itemsFacetWithOtherOwner: ItemsFacet;
  let itemsRolesRegistryFacetWithOwner: Contract;

  before(async function () {
    //await resetChain(hre);

    // workaround for issue https://github.com/NomicFoundation/hardhat/issues/5511
    //await helpers.mine()

    await upgrade();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress,
    )) as AavegotchiFacet;

    wearablesFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/WearableDiamond/facets/WearablesFacet.sol:WearablesFacet",
      wearablesDiamondAddress,
    )) as WearablesFacet;

    itemsRolesRegistryFacet = await ethers.getContractAt(
      "ItemsRolesRegistryFacet",
      diamondAddress,
    );

    let itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress,
    )) as ItemsFacet;

    // get owners of gotchis
    aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(aavegotchiId);
    anotherAavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(
      anotherOwnerAavegotchiId,
    );

    // impersonate signers
    let aavegotchiFacetWithOtherSigner: AavegotchiFacet = await impersonate(
      anotherAavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network,
    );
    let wearablesFacetWithOtherSigner: WearablesFacet = await impersonate(
      anotherWearablesOwner,
      wearablesFacet,
      ethers,
      network,
    );
    wearablesFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      wearablesFacet,
      ethers,
      network,
    );
    itemsFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network,
    );
    itemsFacetWithOtherOwner = await impersonate(
      anotherAavegotchiOwnerAddress,
      itemsFacet,
      ethers,
      network,
    );
    aavegotchiFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      aavegotchiFacet,
      ethers,
      network,
    );
    itemsRolesRegistryFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      itemsRolesRegistryFacet,
      ethers,
      network,
    );

    // transfer gotchi and wearable for tests
    await aavegotchiFacetWithOtherSigner.transferFrom(
      anotherAavegotchiOwnerAddress,
      aavegotchiOwnerAddress,
      anotherOwnerAavegotchiId,
    );
    await wearablesFacetWithOtherSigner.safeTransferFrom(
      anotherWearablesOwner,
      aavegotchiOwnerAddress,
      205,
      1,
      "0x",
    );

    // get gotchis of owner
    gotchisOfOwner = await aavegotchiFacet.tokenIdsOfOwner(
      aavegotchiOwnerAddress,
    );

    // equip transfered wearable on transeferd gotchi
    await itemsFacetWithOwner.equipWearables(gotchisOfOwner[1], otherWearables);
  });

  describe("Testing batch functions to equip wearables", async function () {
    async function getWearables(_tokenId: number): number[] {
      const currentWearables =
        await itemsFacetWithOwner.equippedWearables(_tokenId);
      return currentWearables;
    }

    it("Should unequip all wearables from multiple gotchis", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [gotchisOfOwner[0], gotchisOfOwner[1]],
        [emptyWearables, emptyWearables],
      );
      expect(await getWearables(gotchisOfOwner[0])).to.deep.equal(
        emptyWearables,
      );
      expect(await getWearables(gotchisOfOwner[1])).to.deep.equal(
        emptyWearables,
      );

      // reset for next test
      await itemsFacetWithOwner.equipWearables(gotchisOfOwner[0], wearables);
      await itemsFacetWithOwner.equipWearables(
        gotchisOfOwner[1],
        otherWearables,
      );
    });
    it("Should be able to unequip and requip the same gotchi", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [aavegotchiId, aavegotchiId],
        [emptyWearables, wearables],
      );
      expect(await getWearables(aavegotchiId)).to.deep.equal(wearables);
    });
    it("Should be able to unequip from one gotchi to equip on the next", async function () {
      await itemsFacetWithOwner.batchEquipWearables(
        [gotchisOfOwner[0], gotchisOfOwner[1]],
        [emptyWearables, wearables],
      );
      expect(await getWearables(gotchisOfOwner[0])).to.deep.equal(
        emptyWearables,
      );
      expect(await getWearables(gotchisOfOwner[1])).to.deep.equal(wearables);

      // reequip for next test (inversed)
      await itemsFacetWithOwner.equipWearables(
        gotchisOfOwner[0],
        otherWearables,
      );
    });
    it("Should be able to completely flip wearables between two gotchis", async function () {
      const firstGotchiId = gotchisOfOwner[0];
      const secondGotchiId = gotchisOfOwner[1];
      const firstGotchiWearables = await getWearables(firstGotchiId);
      const secondGotchiWearables = await getWearables(secondGotchiId);
      await itemsFacetWithOwner.batchEquipWearables(
        [firstGotchiId, secondGotchiId, firstGotchiId, secondGotchiId],
        [
          emptyWearables,
          emptyWearables,
          secondGotchiWearables,
          firstGotchiWearables,
        ],
      );
      expect(await getWearables(firstGotchiId)).to.deep.equal(
        secondGotchiWearables,
      );
      expect(await getWearables(secondGotchiId)).to.deep.equal(
        firstGotchiWearables,
      );

      // unequip to free wearables for next test
      await itemsFacetWithOwner.equipWearables(
        gotchisOfOwner[0],
        emptyWearables,
      );

      // retransfer to other owner for next test
      await aavegotchiFacetWithOwner.transferFrom(
        aavegotchiOwnerAddress,
        anotherAavegotchiOwnerAddress,
        anotherOwnerAavegotchiId,
      );
    });
    it("Should unequip and requip wearables with rentals ", async function () {
      let CommitmentCreated: Commitment;
      let GrantRoleData: GrantRoleData;
      let depositIdsCounter = 0;

      // rent a wearable
      CommitmentCreated = buildCommitment({
        grantor: aavegotchiOwnerAddress,
        tokenAddress: wearablesDiamondAddress,
        tokenId: 1,
      });

      depositIdsCounter = Number(
        (
          await itemsRolesRegistryFacet
            .connect(aavegotchiOwnerAddress)
            .callStatic.commitTokens(
              CommitmentCreated.grantor,
              CommitmentCreated.tokenAddress,
              CommitmentCreated.tokenId,
              CommitmentCreated.tokenAmount,
            )
        ).toString(),
      );

      GrantRoleData = await buildGrantRole({
        depositId: depositIdsCounter,
        grantee: anotherAavegotchiOwnerAddress,
      });

      await wearablesFacetWithOwner.setApprovalForAll(
        itemsRolesRegistryFacet.address,
        true,
      );

      await itemsRolesRegistryFacetWithOwner.commitTokens(
        CommitmentCreated.grantor,
        CommitmentCreated.tokenAddress,
        CommitmentCreated.tokenId,
        CommitmentCreated.tokenAmount,
      );
      await itemsRolesRegistryFacetWithOwner.grantRole(
        GrantRoleData.depositId,
        GrantRoleData.role,
        GrantRoleData.grantee,
        GrantRoleData.expirationDate,
        GrantRoleData.revocable,
        GrantRoleData.data,
      );

      // unequip and reequip with rental
      await itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
        [anotherOwnerAavegotchiId, anotherOwnerAavegotchiId],
        [emptyWearables, wearablesWithRentals],
        [emptyWearables, depositIdsOfWearableRentals],
      );
      expect(await getWearables(anotherOwnerAavegotchiId)).to.deep.equal(
        wearablesWithRentals,
      );
    });
    it("Should revert if arguments are not all the same length ", async function () {
      await expect(
        itemsFacetWithOwner.batchEquipWearables(
          [gotchisOfOwner[0], gotchisOfOwner[1]],
          [emptyWearables],
        ),
      ).to.be.revertedWith(
        "ItemsFacet: _wearablesToEquip length not same as _tokenIds length",
      );
      await expect(
        itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
          [anotherOwnerAavegotchiId, anotherOwnerAavegotchiId],
          [emptyWearables],
          [emptyWearables, emptyWearables],
        ),
      ).to.be.revertedWith(
        "ItemsFacet: _wearablesToEquip length not same as _tokenIds length",
      );
      await expect(
        itemsFacetWithOtherOwner.batchEquipDelegatedWearables(
          [aavegotchiId, aavegotchiId],
          [emptyWearables, emptyWearables],
          [emptyWearables],
        ),
      ).to.be.revertedWith(
        "ItemsFacet: _depositIds length not same as _tokenIds length",
      );
    });
  });
});
