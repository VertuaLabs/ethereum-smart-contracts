// contracts/VertuaLabsPermissiveNFT.sol
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/// @author VertuaLabs
/// @title VertuaLabs Permissive NFT Contract
contract VertuaLabsPermissiveNFT is Ownable, ERC721PresetMinterPauserAutoId {
  bool isPermissive;

  constructor(
    string memory name,
    string memory symbol,
    string memory metadataUri
  ) ERC721PresetMinterPauserAutoId(name, symbol, metadataUri) {
    isPermissive = true;
  }

  function safeMint(uint256 id) public {
    if (isPermissive == false) {
      require(
        hasRole('MINTER_ROLE', msg.sender),
        'Caller does not have MINTER_ROLE'
      );
    }
    _safeMint(msg.sender, id);
  }

  function safeMint(address to, uint256 id) public {
    if (isPermissive == false) {
      require(
        hasRole('MINTER_ROLE', msg.sender),
        'Caller does not have MINTER_ROLE'
      );
    }
    _safeMint(to, id);
  }

  function safeMintSeries(uint256[] calldata ids) public {
    if (isPermissive == false) {
      require(
        hasRole('MINTER_ROLE', msg.sender),
        'Caller does not have MINTER_ROLE'
      );
    }
    for (uint256 i = 0; i < ids.length; i++) {
      uint256 id = ids[i];
      _safeMint(msg.sender, id);
    }
  }

  function safeMint(address to, uint256[] calldata ids) public {
    if (isPermissive == false) {
      require(
        hasRole('MINTER_ROLE', msg.sender),
        'Caller does not have MINTER_ROLE'
      );
    }
    for (uint256 i = 0; i < ids.length; i++) {
      uint256 id = ids[i];
      _safeMint(to, id);
    }
  }

  function setPermissive(bool _state) public onlyOwner {
    isPermissive = _state;
  }
}
