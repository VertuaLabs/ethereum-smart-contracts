# VertuaLabs Ethereum Smart Contracts

This repo contains open-sourced Ethereum Smart Contracts

## NFT (Permissive)

A smart contract based upon OpenZeppelin's [ERC721PresetMinterPauserAutoId](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#ERC721PresetMinterPauserAutoId)

We extend the base contract by adding a "Permissive" layer. When the contract is permissive (permissive = true) anyone can mint a new NFT token. When permissive is false, then only those with the MINTER_ROLE are able to mint new NFT tokens.
