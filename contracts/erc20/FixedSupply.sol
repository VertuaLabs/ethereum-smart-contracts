// contracts/VertuaLabsERC20FixedSupply
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/// @author VertuaLabs
/// @title VertuaLabs Fixed Supply ERC20
contract ERC20FixedSupply is Ownable, ERC20PresetFixedSupply {
  using SafeERC20 for IERC20;

  constructor(
    string memory name,
    string memory symbol,
    uint256 initialSupply,
    address owner
  ) ERC20PresetFixedSupply(name, symbol, initialSupply, owner) {}
}
