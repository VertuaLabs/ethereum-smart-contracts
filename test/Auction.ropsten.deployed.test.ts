/* eslint-disable jest/valid-expect */
import "@nomiclabs/hardhat-waffle";

import { expect } from "chai";
import { Contract } from "ethers";
import * as admin from "firebase-admin";
import { ethers } from "hardhat";

import AuctionArtifact from "../artifacts/contracts/auctions/GenericPermissiveAuction.sol/GenericPermissiveAuction.json";
import deployedContracts from "../deployed_contracts.json";
import serviceAccount from "../keys/cellebritybio--production-firebase-adminsdk-43br6-c3b614c4bb.json";
import secrets from "../keys/secrets.json";

admin.initializeApp({
  // @ts-ignore
  credential: admin.credential.cert(serviceAccount),
});

const auctionContractAddress = deployedContracts.ropsten.auctionAddress;
const nftContractAddress = deployedContracts.ropsten.nftAddress;
const network = 'ropsten';

/**  This code is an integration test against already deployed Auction and Card contracts
 * To deploy new contracts see CBAuction.ropste.test.ts
 * TODO: will need additional wallets for testing bidding
 */
describe('Ropsten Auction Deployed Integration Tests', function () {
  let auctionContract: Contract;
  // cardContract: Contract;
  let owner: any;
  // let highestBid;

  before(async function () {
    const provider = ethers.getDefaultProvider(network, {
      alchemy: secrets.alchemyApiKey,
      infura: {
        projectId: secrets.infura.projectId,
        secret: secrets.infura.secret,
      },
      etherscan: secrets.etherscanApiKey,
    });
    // console.log('provider', provider);

    owner = new ethers.Wallet(secrets.primaryTestWallet.privateKey, provider);

    // Attach to the existing deployed contracts
    auctionContract = new ethers.Contract(
      auctionContractAddress,
      AuctionArtifact.abi,
      owner,
    );

    //
  });

  // beforeEach(async function () {
  //   const [owner, addr1] = await ethers.getSigners();
  //   auction = await Auction.deploy();
  //   await auction.deployed();
  // });

  it('properly assigneded contract ownership', async function () {
    const address = await auctionContract.owner();
    console.log('address', address, owner.address);

    expect(await auctionContract.owner()).to.equal(owner.address);
  });

  it('can create an auction', async function () {
    // address sellerAddress,
    // uint256 auctionId,
    // address nftAddress,
    // uint256 nftId,
    // uint256 reserve
    // string metadataUri
    // string createAuctionRequestId
    await expect(
      await auctionContract.connect(owner).createAuction(
        auctionContract.address,
        ethers.BigNumber.from('42'),
        ethers.utils.parseEther('0.1'),
        'metadataUri',
        'firestoreId',
        // { gasLimit: 850000 },
      ),
    )
      .to.emit(auctionContract, 'AuctionCreated')
      .withArgs(
        owner.address,
        '6',
        auctionContract.address,
        '42',
        '0.1',
        'metadataUri',
        'firestoreId',
      );
  });
});
