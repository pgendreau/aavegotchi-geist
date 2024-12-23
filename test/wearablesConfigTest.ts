/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-wearablesConfigFacet";
import { impersonate, resetChain } from "../scripts/helperFunctions";
import {
  AavegotchiFacet,
  WearablesConfigFacet,
} from "../typechain";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

const { expect } = chai;

describe("Testing Wearables Config", async function () {
  this.timeout(300000);

  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d"; // polygon mainnet
  //const diamondAddress = '0x226625C1B1174e7BaaE8cDC0432Db0e2ED83b7Ba'; // polter-testnet
  const slotPrice = ethers.utils.parseUnits("1", "ether");
  const wearablesToStore = [105, 209, 159, 104, 106, 65, 413, 210, 0, 0, 0, 0, 0, 0, 0, 0];
  const aavegotchiId = 4895;

  let aavegotchiOwnerAddress: any;
  let daoAddress: any;
  let aavegotchiFacet: AavegotchiFacet;
  let wearablesConfigFacetWithOwner: WearablesConfigFacet;

  before(async function () {
    await resetChain(hre);
    // workaround for issue https://github.com/NomicFoundation/hardhat/issues/5511
    await helpers.mine()

    await upgrade();

    aavegotchiFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/AavegotchiFacet.sol:AavegotchiFacet",
      diamondAddress
    )) as AavegotchiFacet;

    //aavegotchiOwnerAddress = await aavegotchiFacet.ownerOf(aavegotchiId);
    aavegotchiOwnerAddress = "0x43FF4C088df0A425d1a519D3030A1a3DFff05CfD";

    //const accounts = await ethers.getSigners();
    //const ownerAddress = await accounts[0].getAddress();
    //daoAddress = ownerAddress;
    daoAddress = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

    const wearablesConfigFacet = (await ethers.getContractAt(
      "WearablesConfigFacet",
      diamondAddress
    )) as WearablesConfigFacet;

    wearablesConfigFacetWithOwner = await impersonate(
      aavegotchiOwnerAddress,
      wearablesConfigFacet,
      ethers,
      network
    );
  });

  describe("Testing createWearablesConfig", async function () {
    it("Should revert if wearables list is invalid", async function () {
      const invalidWearables = new Array(16).fill(1);
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "Test", invalidWearables)
      ).to.be.revertedWith(
        "WearablesConfigFacet: Invalid wearables"
      );
    });
    it("Should revert if wearablesConfig name is empty", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "", wearablesToStore)
      ).to.be.revertedWith("WearablesConfigFacet: WearablesConfig name cannot be blank");
    });
    it("Should succeed to create wearablesConfig if all parameters are valid", async function () {
      const receipt = await (
        // config #1
        await wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "Test", wearablesToStore)
      ).wait();
      // verify wearablesConfig id from event
      const event = receipt!.events!.find(
        (event) => event.event === "WearablesConfigCreated"
      );
      const wearablesConfigId = event!.args!.wearablesConfigId;
      expect(wearablesConfigId).to.equal(0);
      // check wearablesConfig name
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(aavegotchiOwnerAddress, aavegotchiId, 0)
      ).to.equal("Test");
      // check wearablesConfig stored wearables
      const wearables = await wearablesConfigFacetWithOwner.getWearablesConfigWearables(aavegotchiOwnerAddress, aavegotchiId, 0);
      expect(
        wearables.map(bigNumber => bigNumber.toNumber())
      ).to.eql(wearablesToStore);
    });
  });

  describe("Testing getWearablesConfig", async function () {
    it("Should revert if invalid wearablesConfig id", async function () {
      await expect(
        wearablesConfigFacetWithOwner.getWearablesConfig(aavegotchiOwnerAddress, aavegotchiId, 99)
      ).to.be.revertedWith("WearablesConfigFacet: invalid id, WearablesConfig not found");
    });
    it("Should return name and wearables array if valid wearablesConfig id", async function () {
      const wearablesConfig = await wearablesConfigFacetWithOwner.getWearablesConfig(aavegotchiOwnerAddress, aavegotchiId, 0);
      expect(wearablesConfig.name).to.equal("Test");
      expect(wearablesConfig.wearables.map(bigNumber => bigNumber.toNumber())).to.eql(wearablesToStore);
    });
  });

  describe("Testing updateWearablesConfig", async function () {
    it("Should be able to update existing WearablesConfig if all parameters are valid", async function () {
      const newWearablesToStore = new Array(16).fill(0);
      const receipt = await (
        await wearablesConfigFacetWithOwner.updateWearablesConfig(aavegotchiId, 0, "New Name", newWearablesToStore)
      ).wait();
      // check wearablesConfig id from event 
      const event = receipt!.events!.find(
        (event) => event.event === "WearablesConfigUpdated"
      );
      expect(event!.args!.wearablesConfigId).to.equal(0);
      // check wearablesConfig name
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(aavegotchiOwnerAddress, aavegotchiId, 0)
      ).to.equal("New Name");
      // check wearablesConfig stored wearables
      const wearables = await wearablesConfigFacetWithOwner.getWearablesConfigWearables(aavegotchiOwnerAddress, aavegotchiId, 0);
      expect(
        wearables.map(bigNumber => bigNumber.toNumber())
      ).to.eql(newWearablesToStore);
    });
    it("Should revert if invalid wearablesConfig id", async function () {
      await expect(
        wearablesConfigFacetWithOwner.updateWearablesConfig(aavegotchiId, 99, "Test", wearablesToStore)
      ).to.be.revertedWith("WearablesConfigFacet: invalid id, WearablesConfig not found");
    });
  });

  describe("Testing wearablesConfigExists", async function () {
    it("Should return true for valid wearablesConfig", async function () {
      expect(
        await wearablesConfigFacetWithOwner.wearablesConfigExists(aavegotchiOwnerAddress, aavegotchiId, 0)
      ).to.be.true;
    });
    it("Should return false for invalid wearablesConfig", async function () {
      expect(
        await wearablesConfigFacetWithOwner.wearablesConfigExists(aavegotchiOwnerAddress, aavegotchiId, 99)
      ).to.be.false;
    });
  });

  describe("Testing getAavegotchiWearablesConfigCount", async function () {
    it("Should return the right amount of wearablesConfig", async function () {
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(aavegotchiOwnerAddress, aavegotchiId)
      ).to.equal(1);
      // config #2
      await wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "Test", wearablesToStore)
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(aavegotchiOwnerAddress, aavegotchiId)
      ).to.equal(2);
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(aavegotchiOwnerAddress, 2499)
      ).to.equal(0);
    });
  });

  describe("Testing createWearablesConfig with payment", async function () {
    it("Should be able to create a 3rd for free", async function () {
      // config #3
      await wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "Test", wearablesToStore)
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(aavegotchiOwnerAddress, aavegotchiId)
      ).to.equal(3);
    });
    it("Should not be able to create a 4th for free", async function () {
      await expect(
        wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "Test", wearablesToStore)
      ).to.be.revertedWith("WearablesConfigFacet: Incorrect GHST value sent");
    });
    it("Should be able to pay for the 4th", async function () {
      // compare owner balance before and after
      //const ownerBalanceBefore = await ethers.provider.getBalance(aavegotchiOwnerAddress);
      const daoBalanceBefore = await ethers.provider.getBalance(daoAddress);
      await wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "Test 4th", wearablesToStore, { value: ethers.utils.parseEther("1") })
      // compare balance before and after for dao address
      //const ownerBalanceAfter = await ethers.provider.getBalance(aavegotchiOwnerAddress);
      //expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(ethers.utils.parseEther("1")));
      const daoBalanceAfter = await ethers.provider.getBalance(daoAddress);
      expect(daoBalanceAfter).to.equal(daoBalanceBefore.add(ethers.utils.parseEther("1")));
      expect(
        await wearablesConfigFacetWithOwner.getWearablesConfigName(aavegotchiOwnerAddress, aavegotchiId, 3)
      ).to.equal("Test 4th");
    });
  });
});
