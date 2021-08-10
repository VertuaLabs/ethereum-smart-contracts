# NOTES

Usually NFTs are transferred to an Auction account that holds the NFT until the Auction is over and either transfer the NFT to the winner or returns the NFT to the (prior) holder

original inspiration for the single auction:

- <https://docs.soliditylang.org/en/v0.8.5/solidity-by-example.html#simple-open-auction>

<https://ethereum.stackexchange.com/questions/97114/designing-a-smart-contract-that-can-buy-or-bid-on-an-nft-on-behalf-of-a-user>

<https://medium.com/upstate-interactive/mappings-in-solidity-explained-in-under-two-minutes-ecba88aff96e>

need to use the OZ interface for accepting NFTs to hold

- will need to call safeTransferFrom on the CardContract

Using OZ (openzeppelin) Ownable, but should transition to RBAC <https://docs.openzeppelin.com/contracts/2.x/access-control>
