/* eslint-disable jest/valid-expect */
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import '@nomiclabs/hardhat-waffle';
import { assert, expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import Card from '../artifacts/contracts/nfts/VertuaLabsPermissiveNFT.sol/VertuaLabsPermissiveNFT.json';

// Start test block
describe('NFT Local Test', function () {
  let nftContract: Contract;

  let nftId: string; //NFT Contract's nft/token Id

  let owner: SignerWithAddress,
    auctioneer: SignerWithAddress,
    minter: SignerWithAddress,
    seller: SignerWithAddress,
    bidder: SignerWithAddress;

  before(async function () {
    [owner, auctioneer, minter, seller, bidder] = await ethers.getSigners();
    const abi = Card.abi;
    // Deploy the NFT Contract to the local hardhat node

    const NFTFactory = await ethers.getContractFactory(
      'VertuaLabsPermissiveNFT',
    );
    // console.log(NFTFactory);

    nftContract = await NFTFactory.connect(owner).deploy(
      'name',
      'symbol',
      'metadatauri',
    );
    console.log(nftContract);

    await nftContract.deployed();
    console.log(`NFT Contract deployed to ${nftContract.address}`);
  });

  // beforeEach(async function () {
  //   const [owner, addr1] = await ethers.getSigners();
  //   nftContract = await Card.deploy();
  //   await nftContract.deployed();
  // });

  it('properly assigneded ownership', async function () {
    const address = await nftContract.owner();
    console.log('address', address, owner.address);

    expect(await nftContract.owner()).to.equal(owner.address);
    return true;
  });

  it('properly list number of nftContracts', async function () {
    const balance = await nftContract.balanceOf(owner.address);
    console.log('balance', balance.toString());

    assert(balance.toString());
    return true;
  });

  // it("properly get nftContract metadata uri", async function () {
  //   const balance = await nftContract.tokenURI(1);
  //   console.log("balance", balance.toString());
  //   assert(balance.toString());
  // });

  it('safeMint a nftContract', async function () {
    // const [owner, addr1] = await ethers.getSigners();
    // result = await nftContract.mint(addr1.address);
    // result = await nftContract.balanceOf(owner.address);
    const nftContractId = Math.floor(1000000 * Math.random()).toString();
    // const nftContractId = 7;
    await expect(await nftContract['safeMint(uint256)'](nftContractId))
      // await expect(await nftContract.mint(owner.address))
      .to.emit(nftContract, 'Transfer')
      .withArgs(
        '0x0000000000000000000000000000000000000000',
        owner.address,
        nftContractId,
      );
    return true;
  });

  // it('does not allow minting from non-owner addresses', async function () {
  //   expect(nftContract.connect(addr2).mint(addr1.address)).to.be.reverted;
  // });

  // it('mintCard', async function () {
  //   // Note. On minting, the nftContract is minted from the null address and immediately transferred to our owner address
  //   await expect(nftContract.mintCard(42))
  //     .to.emit(nftContract, 'Transfer')
  //     .withArgs(
  //       '0x0000000000000000000000000000000000000000',
  //       owner.address,
  //       42,
  //     );
  // });

  // it('mintCard saves expected uri', async function () {
  //   // await expect(nftContract.mintCard(42))
  //   //   .to.emit(nftContract, 'Transfer')
  //   //   .withArgs(
  //   //     '0x0000000000000000000000000000000000000000',
  //   //     owner.address,
  //   //     42,
  //   //   );

  //   //what the uri that gets made?
  //   const uri = await nftContract.tokenURI(42);
  //   console.log('uri', uri);
  //   expect(await nftContract.tokenURI(42)).to.be.equal(
  //     'https://stembionix.com/nfts/metadata/42',
  //   );
  // });

  // it('shows total supply', async function () {
  //   expect(await nftContract.totalSupply()).to.equal(2);
  // });

  // it('shows tokenByIndex', async function () {
  //   expect(await nftContract.tokenByIndex(0)).to.equal(0);
  //   expect(await nftContract.tokenByIndex(1)).to.equal(42);
  // });

  // it('transfers ownership', async function () {
  //   // Note. On minting, the nftContract is minted from the null address and immediately transferred to our owner address
  //   const resposne = await nftContract.mintCard(1225);
  //   await expect(nftContract.transferFrom(owner.address, addr1.address, 1225))
  //     .to.emit(nftContract, 'Transfer')
  //     .withArgs(owner.address, addr1.address, 1225);

  //   expect(await nftContract.ownerOf(1225)).to.not.be.equal(owner.address);
  //   expect(await nftContract.ownerOf(1225)).to.equal(addr1.address);

  //   // FIXME: this should work
  //   // cf. <https://ethereum.stackexchange.com/questions/86986/safetransferfrom-is-undefined-in-buidler-test>
  //   // await expect(
  //   //   nftContract['safeTransferFrom(address, address, uint256)'](
  //   //     addr1.address,
  //   //     owner.address,
  //   //     1225,
  //   //   ),
  //   // )
  //   //   .to.emit(nftContract, 'Transfer')
  //   //   .withArgs(addr1.address, owner.address, 1225);
  // });
});
