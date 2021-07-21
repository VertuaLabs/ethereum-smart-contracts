import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

import * as admin from "firebase-admin";
import fs from "fs";
import { ethers } from "hardhat";

import serviceAccount from "../keys/cellebritybio--production-firebase-adminsdk-43br6-c3b614c4bb.json";
import secrets from "../keys/secrets.json";

// import serviceAccount from "../keys/cellebritybio--testing-firebase-adminsdk-9tggx-349b437016.json";
admin.initializeApp({
  // @ts-ignore
  credential: admin.credential.cert(serviceAccount),
});

const publicAddress = secrets.primaryTestWallet.publicAddress;
const privateKey = secrets.primaryTestWallet.privateKey;
const network = 'ropsten';

async function main() {
  //Clear out previous NFT details

  // Create provider and deployer wallet
  const provider = ethers.getDefaultProvider(network, {
    alchemy: secrets.alchemyApiKey,
    etherscan: secrets.etherscanApiKey,
  });
  const deployerWallet = new ethers.Wallet(privateKey, provider);
  console.log('Deploying contracts with the account:', deployerWallet.address);
  console.log(
    'Account balance:',
    (await deployerWallet.getBalance()).toString(),
  );

  // Deploy Card Contract
  const Card = await ethers.getContractFactory('CellCard');
  console.log('Deploying Card...');
  const card = await Card.deploy();
  await card.deployed();
  console.log('Card deployed to:', card.address);

  // Update the 'current' contract
  admin
    .firestore()
    .collection('contracts')
    .doc('card')
    .set({ address: card.address, network, deployedBy: publicAddress })
    .catch((error) => console.error(error));

  // Write the complete collections
  admin
    .firestore()
    .collection('contracts')
    .doc('card')
    .collection('deployed')
    .doc(card.address)
    .set({ address: card.address, network, deployedBy: publicAddress })
    .catch((error) => console.error(error));

  // Deploy CBAuction Contract
  const Auction = await ethers.getContractFactory('CBAuction');
  console.log('Deploying Auction...');
  const auction = await Auction.deploy();
  await auction.deployed();
  console.log('Auction deployed to:', auction.address);

  await admin
    .firestore()
    .collection('contracts')
    .doc('auction')
    .set({ address: auction.address, network, deployedBy: publicAddress });

  await admin
    .firestore()
    .collection('contracts')
    .doc('auction')
    .collection('deployed')
    .doc(auction.address)
    .set({ address: auction.address, network, deployedBy: publicAddress });

  // Write deployed addresses to file
  fs.writeFileSync(
    // NB: file is relative to the calling function
    './deployed_contracts.json',
    JSON.stringify({
      auctionAddress: auction.address,
      cardAddress: card.address,
    }),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
