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
        wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "test", invalidWearables)
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
      await wearablesConfigFacetWithOwner.createWearablesConfig(aavegotchiId, "test", wearablesToStore)
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(aavegotchiOwnerAddress, aavegotchiId)
      ).to.equal(2);
      expect(
        await wearablesConfigFacetWithOwner.getAavegotchiWearablesConfigCount(aavegotchiOwnerAddress, 2499)
      ).to.equal(0);
    });
  });

  //describe("Testing getWearablesConfig", async function () {
  //  it("Should revert if invalid wearablesConfig id", async function () {
  //    await expect(
  //      WearablesConfigFacetWithOwner.getWearablesConfig(secondwearablesConfigId + 1)
  //    ).to.be.revertedWith("WearablesConfigFacet: wearablesConfig not found");
  //  });
  //  it("Should return array if valid wearablesConfig id", async function () {
  //    const wearablesConfig = await WearablesConfigFacetWithOwner.getWearablesConfig(wearablesConfigId);
  //    expect(wearablesConfig.owner).to.equal(aavegotchiOwnerAddress);
  //    expect(wearablesConfig.addresses.length).to.equal(2);
  //    expect(wearablesConfig.addresses[0]).to.equal(borrowerAddress);
  //  });
  //});
  //
  //describe("Testing remove from wearablesConfig", async () => {
  //  it("Should remove elements from wearablesConfig", async () => {
  //    let addresses: string[] = [];
  //    for (let i = 0; i < 10; i++) {
  //      addresses.push(
  //        ethers.utils.computeAddress(
  //          ethers.utils.keccak256(ethers.utils.hexlify(i))
  //        )
  //      );
  //    }
  //    await WearablesConfigFacetWithOwner.createWearablesConfig("OMEGALUL", addresses);
  //    let wearablesConfigsLength =
  //      await WearablesConfigFacetWithOwner.getWearablesConfigsLength();
  //    let wearablesConfig = await WearablesConfigFacetWithOwner.getWearablesConfig(
  //      wearablesConfigsLength
  //    );
  //    expect(wearablesConfig.addresses.length).to.equal(10);
  //
  //    await WearablesConfigFacetWithOwner.removeAddressesFromWearablesConfig(
  //      wearablesConfigsLength,
  //      [addresses[0], addresses[5], addresses[9]]
  //    );
  //
  //    wearablesConfig = await WearablesConfigFacetWithOwner.getWearablesConfig(wearablesConfigsLength);
  //    expect(wearablesConfig.addresses.length).to.equal(7);
  //
  //    for (let i = 1; i < 9; i++) {
  //      expect(wearablesConfig.addresses).to.include(addresses[i]);
  //      expect(
  //        await WearablesConfigFacetWithOwner.isWearablesConfiged(
  //          wearablesConfigsLength,
  //          addresses[i]
  //        )
  //      ).to.be.gt(0);
  //      if (i == 4) i++;
  //    }
  //    expect(
  //      await WearablesConfigFacetWithOwner.isWearablesConfiged(
  //        wearablesConfigsLength,
  //        addresses[0]
  //      )
  //    ).to.be.eq(0);
  //    expect(
  //      await WearablesConfigFacetWithOwner.isWearablesConfiged(
  //        wearablesConfigsLength,
  //        addresses[5]
  //      )
  //    ).to.be.eq(0);
  //    expect(
  //      await WearablesConfigFacetWithOwner.isWearablesConfiged(
  //        wearablesConfigsLength,
  //        addresses[9]
  //      )
  //    ).to.be.eq(0);
  //
  //    // REMOVE THEM ALLLLLL
  //    await WearablesConfigFacetWithOwner.removeAddressesFromWearablesConfig(
  //      wearablesConfigsLength,
  //      addresses
  //    );
  //    wearablesConfig = await WearablesConfigFacetWithOwner.getWearablesConfig(wearablesConfigsLength);
  //    expect(wearablesConfig.addresses.length).to.equal(0);
  //    for (let i = 0; i < 10; i++) {
  //      expect(
  //        await WearablesConfigFacetWithOwner.isWearablesConfiged(
  //          wearablesConfigsLength,
  //          addresses[i]
  //        )
  //      ).to.be.eq(0);
  //    }
  //  });
  //});
});
