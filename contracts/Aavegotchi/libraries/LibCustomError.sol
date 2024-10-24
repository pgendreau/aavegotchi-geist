// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

library LibCustomError {
    // ERC721 Marketplace errors
    error GHSTAmountMismatch();
    error ArrayLengthMismatch();

    // error ERC721MarketplaceFacet__ListingCancelled();
    // error ERC721MarketplaceFacet__ListingNotFound();
    // error ERC721MarketplaceFacet__NotOwner();
    // error ERC721MarketplaceFacet__PriceTooLow();

    // // ERC1155 Marketplace errors
    // // error ERC1155MarketplaceFacet__GHSTAmountMismatch();
    // error ERC1155MarketplaceFacet__ListingCancelled();
    // error ERC1155MarketplaceFacet__ListingNotFound();
    // error ERC1155MarketplaceFacet__NotOwner();
    // error ERC1155MarketplaceFacet__PriceTooLow();

    // // ERC721 Buy Order errors
    // // error ERC721BuyOrderFacet__GHSTAmountMismatch();
    // error ERC721BuyOrderFacet__PriceTooLow();
    // error ERC721BuyOrderFacet__OrderNotFound();
    // error ERC721BuyOrderFacet__OrderCancelled();
    // error ERC721BuyOrderFacet__NotBuyer();

    // // Shop errors
    // // error ShopFacet__GHSTAmountMismatch();
    // error ShopFacet__InsufficientBalance();

    // // Lending errors
    // error LibGotchiLending__ListingAlreadyAgreed();
    // error LibGotchiLending__BorrowerOverLimit();
    // error LibGotchiLending__ETHTransferFailed();

    // // General errors
    // error NotAuthorized();
    // error InvalidInput();
    // error ContractPaused();
}
