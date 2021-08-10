import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

import * as admin from "firebase-admin";
import { ethers } from "hardhat";

import serviceAccount from "../../keys/opera-omnia-test-firebase-adminsdk-n7cj2-4b9ccfd0e4.json";
import secrets from "../../keys/secrets.json";

// scripts/auctions/deploy.testnet.ts
admin.initializeApp({
  // @ts-ignore
  credential: admin.credential.cert(serviceAccount),
});

const contractName = 'GenericPermissiveAuction';
const publicAddress = secrets.primaryTestWallet.publicAddress;
const privateKey = secrets.primaryTestWallet.privateKey;
const network = 'ropsten';

async function main() {
  // Create provider and deployer wallet
  const provider = ethers.getDefaultProvider(network, {
    // alchemy: secrets.alchemyApiKey,
    etherscan: secrets.etherscanApiKey,
    infura: {
      projectId: secrets.infura.projectId,
      secret: secrets.infura.secret,
    },
  });
  const deployerWallet = new ethers.Wallet(privateKey, provider);
  console.log('Deploying contracts with the account:', deployerWallet.address);

  try {
    // Deploy Auction Contract
    const Auction = await ethers.getContractFactory(contractName);
    console.log('Deploying Auction...');
    const auction = await Auction.deploy();
    await auction.deployed();
    console.log(`${contractName} deployed to: ${auction.address}`);

    await admin.firestore().collection('contracts').doc('auctions').set({
      address: auction.address,
      network,
      deployedBy: publicAddress,
      name: contractName,
    });

    await admin
      .firestore()
      .collection('contracts')
      .doc('auctions')
      .collection('deployed')
      .doc(auction.address)
      .set({
        address: auction.address,
        network,
        deployedBy: publicAddress,
        name: contractName,
      });
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
