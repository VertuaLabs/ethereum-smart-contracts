/* eslint-disable jest/valid-expect */
import "@nomiclabs/hardhat-waffle";

import { assert, expect } from "chai";
import { ethers } from "hardhat";

import Card from "../artifacts/contracts/nfts/GenericNFT.sol/GenericNFT.json";
import secrets from "../keys/secrets.json";

// This needs to be set to the contract being tested against
const cardContractAddress = '0x2e7401E5b6CEf037d02Ff3cEc882623D2B58A323';

// Start test block
describe('Ropsten Card', function () {
  let card;
  let owner; //, addr1, addr2, addr3, addrs;

  before(async function () {
    const abi = Card.abi;
    const provider = ethers.getDefaultProvider('ropsten', {
      alchemy: secrets.alchemyApiKey,
      ethereum: secrets.etherscanApiKey,
    });
    owner = new ethers.Wallet(secrets.primaryTestWallet.privateKey, provider);
    card = new ethers.Contract(cardContractAddress, abi, owner);
    // addr1 = new ethers.Wallet(provider);
    // [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
    // Card = await ethers.getContractFactory('CellCard');
    // card = await Card.deploy();
    // await card.deployed();
  });

  // beforeEach(async function () {
  //   const [owner, addr1] = await ethers.getSigners();
  //   card = await Card.deploy();
  //   await card.deployed();
  // });

  it('properly assigneded ownership', async function () {
    const address = await card.owner();
    console.log('address', address, owner.address);

    expect(await card.owner()).to.equal(owner.address);
    return true;
  });

  it('properly list number of cards', async function () {
    const balance = await card.balanceOf(owner.address);
    console.log('balance', balance.toString());

    assert(balance.toString());
    return true;
  });

  // it("properly get card metadata uri", async function () {
  //   const balance = await card.tokenURI(1);
  //   console.log("balance", balance.toString());

  //   assert(balance.toString());
  // });

  it('mint a card', async function () {
    // Mint a NFT via the inherited function.
    // const [owner, addr1] = await ethers.getSigners();
    // result = await card.mint(addr1.address);
    // result = await card.balanceOf(owner.address);
    const cardId = Math.floor(1000000 * Math.random()).toString();
    // const cardId = 7;
    await expect(await card.mintCard(cardId))
      // await expect(await card.mint(owner.address))
      .to.emit(card, 'Transfer')
      .withArgs(
        '0x0000000000000000000000000000000000000000',
        owner.address,
        cardId,
      );
    return true;
  });

  // it('does not allow minting from non-owner addresses', async function () {
  //   expect(card.connect(addr2).mint(addr1.address)).to.be.reverted;
  // });

  // it('mintCard', async function () {
  //   // Note. On minting, the card is minted from the null address and immediately transferred to our owner address
  //   await expect(card.mintCard(42))
  //     .to.emit(card, 'Transfer')
  //     .withArgs(
  //       '0x0000000000000000000000000000000000000000',
  //       owner.address,
  //       42,
  //     );
  // });

  // it('mintCard saves expected uri', async function () {
  //   // await expect(card.mintCard(42))
  //   //   .to.emit(card, 'Transfer')
  //   //   .withArgs(
  //   //     '0x0000000000000000000000000000000000000000',
  //   //     owner.address,
  //   //     42,
  //   //   );

  //   //what the uri that gets made?
  //   const uri = await card.tokenURI(42);
  //   console.log('uri', uri);
  //   expect(await card.tokenURI(42)).to.be.equal(
  //     'https://stembionix.com/nfts/metadata/42',
  //   );
  // });

  // it('shows total supply', async function () {
  //   expect(await card.totalSupply()).to.equal(2);
  // });

  // it('shows tokenByIndex', async function () {
  //   expect(await card.tokenByIndex(0)).to.equal(0);
  //   expect(await card.tokenByIndex(1)).to.equal(42);
  // });

  // it('transfers ownership', async function () {
  //   // Note. On minting, the card is minted from the null address and immediately transferred to our owner address
  //   const resposne = await card.mintCard(1225);
  //   await expect(card.transferFrom(owner.address, addr1.address, 1225))
  //     .to.emit(card, 'Transfer')
  //     .withArgs(owner.address, addr1.address, 1225);

  //   expect(await card.ownerOf(1225)).to.not.be.equal(owner.address);
  //   expect(await card.ownerOf(1225)).to.equal(addr1.address);

  //   // FIXME: this should work
  //   // cf. <https://ethereum.stackexchange.com/questions/86986/safetransferfrom-is-undefined-in-buidler-test>
  //   // await expect(
  //   //   card['safeTransferFrom(address, address, uint256)'](
  //   //     addr1.address,
  //   //     owner.address,
  //   //     1225,
  //   //   ),
  //   // )
  //   //   .to.emit(card, 'Transfer')
  //   //   .withArgs(addr1.address, owner.address, 1225);
  // });
});
