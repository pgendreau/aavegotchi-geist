/* global describe it before ethers network */
/* eslint prefer-const: "off" */

//@ts-ignore
import { ethers, network } from "hardhat";
import chai from "chai";
import { upgrade } from "../scripts/upgrades/upgrade-erc1155BuyOrderFacet";
import { impersonate } from "../scripts/helperFunctions";
import { ERC20Token, ERC1155BuyOrderFacet, ItemsFacet } from "../typechain";

const { expect } = chai;

describe("Testing ERC1155 Buy Order", async function () {
  this.timeout(30000000);

  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const maticHolderAddress = "0xd70250731A72C33BFB93016E3D1F0CA160dF7e42";
  const ghstHolderAddress = "0xb4473cfEeDC9a0E94612c6ce883677b63f830DB8";
  const ghstHolder2Address = "0x45fdb9d9Ff3105392bf5F1A3828F9523314117A7";
  const pixelcraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const daoAddress = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
  const testWearableId1 = 228;
  const wearableOwnerAddress1 = "0xae79077D8d922d071797a7F8849430Fed488c005"; //owner of testWearableId1
  const testWearableId2 = 230; // no buy orders
  const wearableOwnerAddress2 = "0xae79077D8d922d071797a7F8849430Fed488c005"; //owner of testWearableId2
  const price = ethers.utils.parseUnits("5", "ether");
  const mediumPrice = ethers.utils.parseUnits("7", "ether");
  const highPrice = ethers.utils.parseUnits("9", "ether");
  const quantity1 = 1;
  const quantity2 = 2;
  const quantity3 = 3;
  const duration0 = 0;
  const duration1 = 86400; // non-zero
  let erc1155BuyOrderFacet: ERC1155BuyOrderFacet;
  let itemsFacet: ItemsFacet;
  let ghstERC20: ERC20Token;
  let wearableOwner1: any;
  let maticHolder: any;
  let ghstHolder: any;
  let firstBuyOrderId: any;
  let secondBuyOrderId: any;
  let thirdBuyOrderId: any;
  let fourthBuyOrderId: any;

  before(async function () {
    await upgrade();

    erc1155BuyOrderFacet = (await ethers.getContractAt(
      "ERC1155BuyOrderFacet",
      diamondAddress
    )) as ERC1155BuyOrderFacet;
    itemsFacet = (await ethers.getContractAt(
      "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
      diamondAddress
    )) as ItemsFacet;

    ghstERC20 = (await ethers.getContractAt(
      "ERC20Token",
      ghstAddress
    )) as ERC20Token;

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [maticHolderAddress],
    });
    maticHolder = await ethers.getSigner(maticHolderAddress);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ghstHolderAddress],
    });
    ghstHolder = await ethers.getSigner(ghstHolderAddress);

    // This is needed for impersonating owner of test wearable
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [wearableOwnerAddress1],
    });
    wearableOwner1 = await ethers.getSigner(wearableOwnerAddress1);

    erc1155BuyOrderFacet = await impersonate(
      ghstHolderAddress,
      erc1155BuyOrderFacet,
      ethers,
      network
    );
  });

  describe("Testing placeERC1155BuyOrder", async function () {
    it("Should revert if cost is lower than 1 GHST", async function () {
      await expect(
        erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId1,
          0,
          quantity1,
          duration0
        )
      ).to.be.revertedWith("ERC1155BuyOrder: cost should be 1 GHST or larger");
      await expect(
        erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId1,
          price,
          0,
          duration0
        )
      ).to.be.revertedWith("ERC1155BuyOrder: cost should be 1 GHST or larger");
      await expect(
        erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId1,
          ethers.utils.parseUnits("0.1", "ether"),
          1,
          duration0
        )
      ).to.be.revertedWith("ERC1155BuyOrder: cost should be 1 GHST or larger");
    });
    it("Should revert if buyer have not enough GHST", async function () {
      await expect(
        erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId1,
          ethers.utils.parseUnits("1000000", "ether"),
          100,
          duration0
        )
      ).to.be.revertedWith("ERC1155BuyOrder: Not enough GHST!");
    });
    describe("If there's no buy order", async function () {
      it("Should succeed", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        await (
          await ghstERC20.connect(ghstHolder)
        ).approve(diamondAddress, price.mul(quantity1));
        const receipt = await (
          await erc1155BuyOrderFacet.placeERC1155BuyOrder(
            diamondAddress,
            testWearableId1,
            price,
            quantity1,
            duration1
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC1155BuyOrderAdd"
        );
        firstBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolderAddress);
        expect(event!.args!.duration).to.equal(duration1);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(newBalance.add(price.mul(quantity1))).to.equal(oldBalance);
      });
    });
    describe("If there's already buy order from same buyer", async function () {
      it("Should succeed and GHST should be transferred if cost is greater than old one", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        await (
          await ghstERC20.connect(ghstHolder)
        ).approve(diamondAddress, mediumPrice.mul(quantity2));
        const receipt = await (
          await erc1155BuyOrderFacet.placeERC1155BuyOrder(
            diamondAddress,
            testWearableId1,
            mediumPrice,
            quantity2,
            duration0
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC1155BuyOrderUpdate"
        );
        expect(event!.args!.buyOrderId).to.equal(firstBuyOrderId);
        expect(event!.args!.priceInWei).to.equal(mediumPrice);
        expect(event!.args!.quantity).to.equal(quantity2);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(
          newBalance.add(mediumPrice.mul(quantity2)).sub(price.mul(quantity1))
        ).to.equal(oldBalance);
      });
      it("Should succeed and GHST should be returned if cost is lower than old one", async function () {
        const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        await (
          await ghstERC20.connect(ghstHolder)
        ).approve(diamondAddress, mediumPrice.mul(quantity2));
        const receipt = await (
          await erc1155BuyOrderFacet.placeERC1155BuyOrder(
            diamondAddress,
            testWearableId1,
            price,
            quantity1,
            duration0
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC1155BuyOrderUpdate"
        );
        expect(event!.args!.buyOrderId).to.equal(firstBuyOrderId);
        expect(event!.args!.priceInWei).to.equal(price);
        expect(event!.args!.quantity).to.equal(quantity1);
        const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
        expect(
          newBalance.add(price.mul(quantity1)).sub(mediumPrice.mul(quantity2))
        ).to.equal(oldBalance);
      });
    });
    describe("If there's already buy order from other buyer", async function () {
      it("Should succeed", async function () {
        const ghstERC20WithHolder2 = await impersonate(
          ghstHolder2Address,
          ghstERC20,
          ethers,
          network
        );
        const erc1155BuyOrderFacetWithHolder2 = await impersonate(
          ghstHolder2Address,
          erc1155BuyOrderFacet,
          ethers,
          network
        );
        const oldBalance = await ghstERC20WithHolder2.balanceOf(
          ghstHolder2Address
        );
        await ghstERC20WithHolder2.approve(
          diamondAddress,
          mediumPrice.mul(quantity1)
        );
        const receipt = await (
          await erc1155BuyOrderFacetWithHolder2.placeERC1155BuyOrder(
            diamondAddress,
            testWearableId1,
            mediumPrice,
            quantity1,
            duration0
          )
        ).wait();
        const event = receipt!.events!.find(
          (e: any) => e.event === "ERC1155BuyOrderAdd"
        );
        secondBuyOrderId = event!.args!.buyOrderId;
        expect(event!.args!.buyer).to.equal(ghstHolder2Address);
        expect(event!.args!.duration).to.equal(duration0);
        const newBalance = await ghstERC20.balanceOf(ghstHolder2Address);
        expect(newBalance.add(mediumPrice.mul(quantity1))).to.equal(oldBalance);
      });
    });
  });

  describe("Testing cancelERC1155BuyOrder (without duration)", async function () {
    it("Should revert when try to cancel buy order with wrong id", async function () {
      await expect(
        erc1155BuyOrderFacet.cancelERC1155BuyOrder(secondBuyOrderId.add(1))
      ).to.be.revertedWith("ERC1155BuyOrder: ERC1155 buyOrder does not exist");
    });
    it("Should revert when try to cancel buy order with non-buyer", async function () {
      await expect(
        (
          await erc1155BuyOrderFacet.connect(maticHolder)
        ).cancelERC1155BuyOrder(firstBuyOrderId)
      ).to.be.revertedWith(
        "ERC1155BuyOrder: Only buyer can call this function"
      );
    });
    it("Should succeed if cancel valid buy order", async function () {
      const oldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const receipt = await (
        await erc1155BuyOrderFacet.cancelERC1155BuyOrder(firstBuyOrderId)
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155BuyOrderCancel"
      );
      expect(event!.args!.buyOrderId).to.equal(firstBuyOrderId);
      const newBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      expect(newBalance.sub(price.mul(quantity1))).to.equal(oldBalance);
    });
    it("Should revert when try to cancel canceled buy order", async function () {
      await expect(
        erc1155BuyOrderFacet.cancelERC1155BuyOrder(firstBuyOrderId)
      ).to.be.revertedWith("ERC1155BuyOrder: Already processed");
    });
  });

  describe("Testing getERC1155BuyOrder", async function () {
    before(async function () {
      const receipt = await (
        await erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId1,
          mediumPrice,
          quantity2,
          duration0
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155BuyOrderAdd"
      );
      thirdBuyOrderId = event!.args!.buyOrderId;
    });
    it("Should revert when try to get buy order with wrong id", async function () {
      await expect(
        erc1155BuyOrderFacet.getERC1155BuyOrder(thirdBuyOrderId.add(1))
      ).to.be.revertedWith("ERC1155BuyOrder: ERC1155 buyOrder does not exist");
    });
    it("Should fetch buy order data with correct buy order id for all status (both cancelled and not)", async function () {
      let buyOrder = await erc1155BuyOrderFacet.getERC1155BuyOrder(
        firstBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(firstBuyOrderId);
      expect(buyOrder.erc1155TokenId).to.equal(testWearableId1);
      expect(buyOrder.duration).to.equal(duration1);
      expect(buyOrder.cancelled).to.equal(true);
      buyOrder = await erc1155BuyOrderFacet.getERC1155BuyOrder(
        secondBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(secondBuyOrderId);
      expect(buyOrder.erc1155TokenId).to.equal(testWearableId1);
      expect(buyOrder.duration).to.equal(duration0);
      expect(buyOrder.cancelled).to.equal(false);
      buyOrder = await erc1155BuyOrderFacet.getERC1155BuyOrder(thirdBuyOrderId);
      expect(buyOrder.buyOrderId).to.equal(thirdBuyOrderId);
      expect(buyOrder.erc1155TokenId).to.equal(testWearableId1);
      expect(buyOrder.duration).to.equal(duration0);
      expect(buyOrder.cancelled).to.equal(false);
    });
  });

  describe("Testing getERC1155BuyOrderIdsByTokenId", async function () {
    it("Should return empty array with wrong wearable id", async function () {
      const buyOrderIds =
        await erc1155BuyOrderFacet.getERC1155BuyOrderIdsByTokenId(
          diamondAddress,
          testWearableId2
        );
      expect(buyOrderIds.length).to.equal(0);
    });
    it("Should fetch active(not cancelled) buy order ids with correct wearable id", async function () {
      const buyOrderIds =
        await erc1155BuyOrderFacet.getERC1155BuyOrderIdsByTokenId(
          diamondAddress,
          testWearableId1
        );
      expect(buyOrderIds.length).to.equal(2);
      expect(buyOrderIds[0]).to.equal(secondBuyOrderId);
      expect(buyOrderIds[1]).to.equal(thirdBuyOrderId);
    });
  });

  describe("Testing getERC1155BuyOrdersByTokenId", async function () {
    after(async function () {
      await (
        await erc1155BuyOrderFacet.cancelERC1155BuyOrder(thirdBuyOrderId)
      ).wait();
    });
    it("Should return empty array with wrong wearable id", async function () {
      const buyOrders = await erc1155BuyOrderFacet.getERC1155BuyOrdersByTokenId(
        diamondAddress,
        testWearableId2
      );
      expect(buyOrders.length).to.equal(0);
    });
    it("Should fetch active(not cancelled) buy orders data with correct wearable id", async function () {
      const buyOrders = await erc1155BuyOrderFacet.getERC1155BuyOrdersByTokenId(
        diamondAddress,
        testWearableId1
      );
      expect(buyOrders.length).to.equal(2);
      expect(buyOrders[0].buyOrderId).to.equal(secondBuyOrderId);
      expect(buyOrders[0].erc1155TokenId).to.equal(testWearableId1);
      expect(buyOrders[0].duration).to.equal(duration0);
      expect(buyOrders[0].cancelled).to.equal(false);
      expect(buyOrders[1].buyOrderId).to.equal(thirdBuyOrderId);
      expect(buyOrders[1].erc1155TokenId).to.equal(testWearableId1);
      expect(buyOrders[1].duration).to.equal(duration0);
      expect(buyOrders[1].cancelled).to.equal(false);
    });
  });

  describe("Testing executeERC1155BuyOrder (without duration)", async function () {
    before(async function () {
      await (
        await ghstERC20.connect(ghstHolder)
      ).approve(diamondAddress, highPrice.mul(quantity3));
      const receipt = await (
        await erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId1,
          highPrice,
          quantity3,
          duration0
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155BuyOrderAdd"
      );
      fourthBuyOrderId = event!.args!.buyOrderId;
    });
    it("Should revert when try to execute buy order with wrong buy order id", async function () {
      await expect(
        erc1155BuyOrderFacet.executeERC1155BuyOrder(
          fourthBuyOrderId.add(10),
          diamondAddress,
          testWearableId1,
          highPrice,
          quantity3
        )
      ).to.be.revertedWith("ERC1155BuyOrder: ERC1155 buyOrder does not exist");
    });
    it("Should revert when try to execute buy order with wrong ERC1155 token address", async function () {
      await expect(
        erc1155BuyOrderFacet.executeERC1155BuyOrder(
          fourthBuyOrderId,
          ethers.constants.AddressZero,
          testWearableId1,
          highPrice,
          quantity3
        )
      ).to.be.revertedWith(
        "ERC1155BuyOrder: ERC1155 token address not matched"
      );
    });
    it("Should revert when try to execute buy order with wrong ERC1155 token id", async function () {
      await expect(
        erc1155BuyOrderFacet.executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1 + 1,
          highPrice,
          quantity3
        )
      ).to.be.revertedWith("ERC1155BuyOrder: ERC1155 token id not matched");
    });
    it("Should revert when try to execute buy order with wrong buy order price", async function () {
      await expect(
        erc1155BuyOrderFacet.executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1,
          price,
          quantity3
        )
      ).to.be.revertedWith("ERC1155BuyOrder: Price not matched");
    });
    it("Should revert when try to execute buy order with buyer", async function () {
      await expect(
        erc1155BuyOrderFacet.executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1,
          highPrice,
          quantity3
        )
      ).to.be.revertedWith("ERC1155BuyOrder: Buyer can't be seller");
    });
    it("Should revert when try to execute canceled buy order", async function () {
      await expect(
        (
          await erc1155BuyOrderFacet.connect(wearableOwner1)
        ).executeERC1155BuyOrder(
          firstBuyOrderId,
          diamondAddress,
          testWearableId1,
          price,
          quantity1
        )
      ).to.be.revertedWith("ERC1155BuyOrder: Already processed");
    });
    it("Should revert when try to execute buy order with larger quantity", async function () {
      await expect(
        (
          await erc1155BuyOrderFacet.connect(wearableOwner1)
        ).executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1,
          highPrice,
          quantity3 + 10
        )
      ).to.be.revertedWith(
        "ERC1155BuyOrder: Sell amount should not be larger than quantity of the buy order"
      );
    });
    it("Should revert when try to execute buy order with non wearable holder", async function () {
      await expect(
        (
          await erc1155BuyOrderFacet.connect(maticHolder)
        ).executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1,
          highPrice,
          quantity3
        )
      ).to.be.revertedWith("ERC1155Marketplace: Not enough ERC1155 token");
    });
    it("Should succeed and uncompleted when execute buy order with valid data and smaller quantity", async function () {
      const buyerOldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerOldBalance = await ghstERC20.balanceOf(wearableOwnerAddress1);
      const daoOldBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftOldBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondOldBalance = await ghstERC20.balanceOf(diamondAddress);
      const wearableBalanceBefore = await itemsFacet.balanceOf(
        ghstHolderAddress,
        testWearableId1
      );

      const receipt = await (
        await (
          await erc1155BuyOrderFacet.connect(wearableOwner1)
        ).executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1,
          highPrice,
          quantity2
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155BuyOrderExecute"
      );
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);
      expect(event!.args!.quantity).to.equal(quantity2);

      const buyerNewBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerNewBalance = await ghstERC20.balanceOf(wearableOwnerAddress1);
      const daoNewBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftNewBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondNewBalance = await ghstERC20.balanceOf(diamondAddress);
      // Check ghst balance changes
      const cost = highPrice.mul(quantity2);
      expect(buyerOldBalance).to.equal(buyerNewBalance);
      expect(sellerNewBalance.sub(sellerOldBalance)).to.equal(
        cost.mul(965).div(1000)
      ); // 96.5%
      expect(daoNewBalance.sub(daoOldBalance)).to.equal(cost.div(100)); // 1%
      expect(pixelcraftNewBalance.sub(pixelcraftOldBalance)).to.equal(
        cost.div(50)
      ); // 2%
      expect(diamondOldBalance.sub(diamondNewBalance)).to.equal(cost);

      // Check wearable owner
      const wearableBalanceAfter = await itemsFacet.balanceOf(
        ghstHolderAddress,
        testWearableId1
      );
      expect(wearableBalanceAfter.sub(wearableBalanceBefore)).to.equal(
        quantity2
      );

      // Check buy order status
      const buyOrder = await erc1155BuyOrderFacet.getERC1155BuyOrder(
        fourthBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(fourthBuyOrderId);
      expect(buyOrder.lastTimePurchased.gt(0)).to.equal(true);
      expect(buyOrder.quantity.toNumber()).to.equal(quantity3 - quantity2);
      expect(buyOrder.completed).to.equal(false);
    });
    it("Should succeed and completed when execute buy order with valid data and remained quantity", async function () {
      const buyerOldBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerOldBalance = await ghstERC20.balanceOf(wearableOwnerAddress1);
      const daoOldBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftOldBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondOldBalance = await ghstERC20.balanceOf(diamondAddress);
      const wearableBalanceBefore = await itemsFacet.balanceOf(
        ghstHolderAddress,
        testWearableId1
      );

      const remainedQuantity = quantity3 - quantity2;
      const receipt = await (
        await (
          await erc1155BuyOrderFacet.connect(wearableOwner1)
        ).executeERC1155BuyOrder(
          fourthBuyOrderId,
          diamondAddress,
          testWearableId1,
          highPrice,
          remainedQuantity
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155BuyOrderExecute"
      );
      expect(event!.args!.buyer).to.equal(ghstHolderAddress);
      expect(event!.args!.quantity).to.equal(remainedQuantity);

      const buyerNewBalance = await ghstERC20.balanceOf(ghstHolderAddress);
      const sellerNewBalance = await ghstERC20.balanceOf(wearableOwnerAddress1);
      const daoNewBalance = await ghstERC20.balanceOf(daoAddress);
      const pixelcraftNewBalance = await ghstERC20.balanceOf(pixelcraftAddress);
      const diamondNewBalance = await ghstERC20.balanceOf(diamondAddress);
      // Check ghst balance changes
      const cost = highPrice.mul(remainedQuantity);
      expect(buyerOldBalance).to.equal(buyerNewBalance);
      expect(sellerNewBalance.sub(sellerOldBalance)).to.equal(
        cost.mul(965).div(1000)
      ); // 96.5%
      expect(daoNewBalance.sub(daoOldBalance)).to.equal(cost.div(100)); // 1%
      expect(pixelcraftNewBalance.sub(pixelcraftOldBalance)).to.equal(
        cost.div(50)
      ); // 2%
      expect(diamondOldBalance.sub(diamondNewBalance)).to.equal(cost);

      // Check wearable owner
      const wearableBalanceAfter = await itemsFacet.balanceOf(
        ghstHolderAddress,
        testWearableId1
      );
      expect(wearableBalanceAfter.sub(wearableBalanceBefore)).to.equal(
        remainedQuantity
      );

      // Check buy order status
      const buyOrder = await erc1155BuyOrderFacet.getERC1155BuyOrder(
        fourthBuyOrderId
      );
      expect(buyOrder.buyOrderId).to.equal(fourthBuyOrderId);
      expect(buyOrder.lastTimePurchased.gt(0)).to.equal(true);
      expect(buyOrder.quantity.toNumber()).to.equal(0);
      expect(buyOrder.completed).to.equal(true);
    });
  });

  describe("Testing duration logic", async function () {
    let wearableOwner2: any;
    let buyOrderId: any;
    before(async function () {
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [wearableOwnerAddress2],
      });
      wearableOwner2 = await ethers.getSigner(wearableOwnerAddress2);
      await (
        await ghstERC20.connect(ghstHolder)
      ).approve(diamondAddress, price);
      const receipt = await (
        await erc1155BuyOrderFacet.placeERC1155BuyOrder(
          diamondAddress,
          testWearableId2,
          price,
          quantity1,
          duration1
        )
      ).wait();
      const event = receipt!.events!.find(
        (e: any) => e.event === "ERC1155BuyOrderAdd"
      );
      buyOrderId = event!.args!.buyOrderId;

      ethers.provider.send("evm_increaseTime", [duration1 + 1]);
      ethers.provider.send("evm_mine", []);
    });
    it("Should fail if cancel expired buy order", async function () {
      await expect(
        erc1155BuyOrderFacet.cancelERC1155BuyOrder(buyOrderId)
      ).to.be.revertedWith("ERC1155BuyOrder: Already expired");
    });
    it("Should fail if execute expired buy order", async function () {
      await expect(
        (
          await erc1155BuyOrderFacet.connect(wearableOwner2)
        ).executeERC1155BuyOrder(
          buyOrderId,
          diamondAddress,
          testWearableId2,
          price,
          quantity1
        )
      ).to.be.revertedWith("ERC1155BuyOrder: Already expired");
    });
  });
});
