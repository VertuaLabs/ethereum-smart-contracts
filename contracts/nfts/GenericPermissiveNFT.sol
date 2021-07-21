// contracts/GenericPermissiveNFT.sol
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract GenericPermissiveNFT is Ownable, ERC721PresetMinterPauserAutoId {
  bool isPermissive;

  constructor(
    string memory name,
    string memory symbol,
    string memory metadataUri
  ) ERC721PresetMinterPauserAutoId(name, symbol, metadataUri) {
    isPermissive = true;
  }

  function safeMint(address to, uint256 id) public onlyOwner {
    _safeMint(to, id);
  }

  function setPermissive(bool _state) public onlyOwner {
    isPermissive = _state;
  }

  function safePermissiveMint(uint256 id) public {
    require(isPermissive == true, 'Contract not in Permissive State');
    _safeMint(msg.sender, id);
  }
}
