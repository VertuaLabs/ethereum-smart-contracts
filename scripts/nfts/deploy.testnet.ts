import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

import * as admin from "firebase-admin";
import { ethers } from "hardhat";

import serviceAccount from "../../keys/opera-omnia-test-firebase-adminsdk-n7cj2-4b9ccfd0e4.json";
import secrets from "../../keys/secrets.json";

admin.initializeApp({
  // @ts-ignore
  credential: admin.credential.cert(serviceAccount),
});
const publicAddress = secrets.primaryTestWallet.publicAddress;
const privateKey = secrets.primaryTestWallet.privateKey;
const network = 'ropsten';

async function main() {
  // Create provider and deployer wallet
  const provider = ethers.getDefaultProvider(network, {
    alchemy: secrets.alchemyApiKey,
    etherscan: secrets.etherscanApiKey,
    infura: {
      projectId: secrets.infura.projectId,
      secret: secrets.infura.secret,
    },
  });
  const deployerWallet = new ethers.Wallet(privateKey, provider);
  console.log('Deploying contracts with the account:', deployerWallet.address);

  try {
    // Deploy Contract
    const Card = await ethers.getContractFactory('GenericPermissiveNFT');
    console.log('Deploying NFT Contract...');
    const card = await Card.deploy();
    await card.deployed();
    console.log('GenericNFT Contract deployed to:', card.address);

    await admin.firestore().collection('contracts').doc('nfts').set({
      address: card.address,
      network,
      deployedByAddress: publicAddress,
    });

    await admin
      .firestore()
      .collection('contracts')
      .doc('nfts')
      .collection('deployed')
      .doc(card.address)
      .set({
        address: card.address,
        network,
        deployedByAddress: publicAddress,
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
