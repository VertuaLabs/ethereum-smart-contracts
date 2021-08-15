# VertuaLabs Ethereum Smart Contracts

This repo contains open-sourced Ethereum Smart Contracts.

These smart contracts are used in [OperaOmnia](https://operaomnia.app).

## Auction Contract

The Auction Contract implements a highest bidder (aka an English Auction).

## ERC-20 Contracts

### Fixed Supply

### Minter

## ERC-721 NFT Permissive Contract

A smart contract based upon OpenZeppelin's [ERC721PresetMinterPauserAutoId](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#ERC721PresetMinterPauserAutoId)

We extend the base contract by adding a "Permissive" layer. When the contract is permissive (permissive = true) anyone can mint a new NFT token. When permissive is false, then only those with the MINTER_ROLE are able to mint new NFT tokens.
