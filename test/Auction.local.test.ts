import "@nomiclabs/hardhat-waffle";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import * as admin from "firebase-admin";
import { ethers } from "hardhat";

import serviceAccount from "../keys/opera-omnia-test-firebase-adminsdk-n7cj2-4b9ccfd0e4.json";

/* eslint-disable jest/valid-expect */
admin.initializeApp({
  //@ts-ignore
  credential: admin.credential.cert(serviceAccount),
});

// I want to test the generic functionality of this. make sure I have padding correct. If so. Off to the races.
describe('Auction Local', function () {
  let auctionContract: Contract;
  let auctionId: string; //Auction Contract's 'auction' Id
  let nftContract: Contract;
  let nftId: string; //NFT Contract's nft/token Id

  let owner: SignerWithAddress,
    auctioneer: SignerWithAddress,
    minter: SignerWithAddress,
    seller: SignerWithAddress,
    bidder: SignerWithAddress;

  const reserve = ethers.utils.parseEther(
    Math.ceil(Math.random() * 10).toString(),
  );

  const userId = '0x0';
  const user = {
    id: '0x0',
    username: 'mock-test',
    displayName: 'mock test',
    headline: 'mock test',
    about: 'mock test',
    photoURL: '',
  };

  const AuctionState = {
    CREATED: 0,
    READY: 1,
    PREAUCTION: 2,
    COUNTINGDOWN: 3,
    ENDED: 4,
    CANCELLED: 5,
  };

  before(async function () {
    [owner, auctioneer, minter, seller, bidder] = await ethers.getSigners();

    // Deploy the NFT Contract to the local hardhat node
    const NFTFactory = await ethers.getContractFactory('GenericPermissiveNFT');
    nftContract = await NFTFactory.connect(owner).deploy();
    await nftContract.deployed();
    console.log(`NFT Contract deployed to ${nftContract.address}`);

    // Deploy the Auction Contract to the local hardhat node
    const AuctionFactory = await ethers.getContractFactory(
      'GenericPermissiveAuction',
    );
    auctionContract = await AuctionFactory.connect(owner).deploy();
    await auctionContract.deployed();
    console.log(`Auction Contract deployed to ${auctionContract.address}`);

    // Steps to Create an Auction ------------------------------

    // 0. We need a NFT to Auction
    const txMintNFT = await nftContract['mint(address)'](seller.address);
    const txMintNFTResult = await txMintNFT.wait();
    const mintNFTEvent = txMintNFTResult.events.pop();
    nftId = mintNFTEvent.args.tokenId.toString();
    console.log(
      'mintNFTEvent',
      mintNFTEvent.args.to.toString(),
      seller.address,
      mintNFTEvent.args.tokenId.toString(),
      nftId,
      seller.address == mintNFTEvent.args.to.toString(),
    );
  });

  it('properly assigned auctionContract ownership', async function () {
    expect(await auctionContract.owner()).to.equal(owner.address);
  });

  it('creates an auction', async function () {
    // Create the Auction Transaction (in permissive mode)
    console.log('2. Create Auction Transaction', reserve);
    // TODO: Step 1. Create a new AuctionBid request in Firestore
    // const newAuctionRequest = {
    //   tokenContract: {
    //     address: auctionContract.address,
    //     id: auctionContract.id,
    //   },
    //   name: (10000 * Math.random()).toString(),
    //   description: 'test',
    //   attributes: ['one', 'two', 'three'],
    //   reserve,
    //   requestedBy: seller.address, //publicAddress
    // };
    // const { data } = admin.
    // console.log(auctionBid.toJson());

    const tx = await auctionContract.connect(seller).createAuction(
      nftContract.address, //nftAddress
      nftId, //nftId
      reserve, //Reserve
      '', //metadataUri
      '', //createAuctionRequestId
    );
    const txResult = await tx.wait();
    const event = txResult.events.pop();
    console.log(
      'Create Auction Emitted Event',
      `Seller Address: ${event.args.sellerAddress}`,
      `Auction Id: ${event.args.auctionId}`,
      `NFT Address: ${event.args.nftAddress}`,
      `NFT Id: ${event.args.nftId}`,
      `Reserve: ${ethers.utils.formatEther(event.args.reserve)}`,
      event,
    );
    auctionId = event.args.auctionId.toString();

    expect(event.args.sellerAddress).to.be.equal(seller.address);
    expect(event.args.nftAddress).to.be.equal(nftContract.address);
    expect(event.args.nftId).to.be.equal(nftId);
    expect(event.args.reserve.toString()).to.be.equal(reserve);

    const state = await auctionContract.auctionState(auctionId);
    expect(state.toString()).to.be.equal(AuctionState.CREATED.toString());
  });

  it('can receive and verify nft ownership', async function () {
    // 3. Transfer NFT Ownership to the created Auction
    const nftOwnerAddress = await nftContract.ownerOf(nftId);

    console.log(
      'NFT Owner Address',
      seller.address,
      nftOwnerAddress,
      seller.address == nftOwnerAddress,
      nftId,
    );

    const tx = await nftContract
      .connect(seller)
      ['safeTransferFrom(address,address,uint256)'](
        seller.address,
        auctionContract.address,
        nftId,
      );
    const txResult = await tx.wait();
    const event = txResult.events.pop();
    console.log(
      'NFT Transfer Event: ',
      event.args.from,
      event.args.to,
      event.args.tokenId,
    );

    expect(await nftContract.ownerOf(nftId)).to.equal(auctionContract.address);
  });

  it('properly verify nft ownership via auction functions', async function () {
    const nftAddress = await auctionContract.nftAddress(auctionId);
    console.log(
      'nftAddress',
      nftAddress,
      auctionContract.address,
      nftAddress === auctionContract.address,
    );

    const nftId = await auctionContract.nftId(auctionId);
    console.log('nftId', nftId);

    // const tx = await auctionContract.nftOwner(nftId);
    // const txResult = await tx.wait();
    // console.log('nftOwner', txResult);
  });

  it('properly assigns Ready State', async function () {
    //this is a transaction and not a simple view function, need to parse emitted event
    const txNFTOwner = await auctionContract.nftOwner(nftId);
    const txNFTOwnerResult = await txNFTOwner.wait();
    const nftOwnerEvent = txNFTOwnerResult.events.pop();
    const { _auctionId, _nftAddress, _nftId, _nftOwner } = nftOwnerEvent.args;
    console.log(
      'nftOwner event\n',
      `Auction Id: ${nftOwnerEvent.args.auctionId}\n`,
      `NFT Address: ${nftOwnerEvent.args.nftAddress}\n`,
      `NFT Id: ${nftOwnerEvent.args.nftId}\n`,
      `NFT Owner Address: ${nftOwnerEvent.args.nftOwner}\n`,
      `Is owner correct?: ${nftOwnerEvent.args.nftOwner === seller.address}\n`,
    );

    const txReady = await auctionContract
      .connect(seller)
      .setReadyState(auctionId);
    const txReadyResult = await txReady.wait();
    const event = txReadyResult.events.pop();
    console.log(
      'Ready State Transaction: ',
      event.args.auctionId.toString(),
      event.args.isReady,
    );
    expect(await auctionContract.auctionState(auctionId)).to.equal(1);
  });

  // Put Auction into PreAuction Mode
  it('properly enters PreAuction state', async function () {
    // const txPre = await auctionContract.startPreAuction(auctionId);
    // const txPreResult = await txPre.wait();
    // console.log("PreAuction State Transaction: ", txPreResult.events);
    expect(await auctionContract.connect(seller).startPreAuction(auctionId))
      .to.emit(auctionContract, 'AuctionPreAuctionStarted')
      .withArgs(auctionId, true);
    expect(await auctionContract.auctionState(auctionId)).to.equal(2);
  });

  it('can view highest bid', async function () {
    expect(await auctionContract.highestBid(auctionId)).to.equal(0);
  });

  // should not be able to bid unless Biddable
  it('can bid with ETH', async function () {
    const comment = 'hello world';

    await expect(
      auctionContract.connect(bidder).bid(auctionId, comment, {
        value: ethers.utils.parseEther('0.1'),
      }),
    )
      .to.emit(auctionContract, 'HighestBidIncreased')
      .withArgs(
        auctionId, //auctionId
        bidder.address,
        ethers.utils.parseEther('0.1'),
        0,
        comment,
      );
  });

  it('can view highest bid after bids', async function () {
    expect(await auctionContract.highestBid(auctionId)).to.equal(
      ethers.utils.parseEther('0.1'),
    );
  });
});
