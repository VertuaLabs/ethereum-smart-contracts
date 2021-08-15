// contracts/VertuaLabsERC20FixedSupply
// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/// @author VertuaLabs
/// @title VertuaLabs Minter ERC20
contract VertuaLabsERC20Minter is Ownable, ERC20PresetMinterPauser {
  using SafeERC20 for IERC20;

  constructor(string memory name, string memory symbol)
    ERC20PresetMinterPauser(name, symbol)
  {}
}
