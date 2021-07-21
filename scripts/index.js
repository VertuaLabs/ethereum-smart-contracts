// scripts/index.js
const metadataUri = require('./nft.json');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();

async function main() {
  // Our code will go here
  const accounts = await ethers.provider.listAccounts();
  console.log(accounts);

  // const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  // const Box = await ethers.getContractFactory('Box');
  // const box = await Box.attach(address);
  // console.log(box);

  // // Call the retrieve() function of the deployed Box contract
  // value = await box.retrieve();
  // console.log('Box value is', value.toString());

  // Mock code for what we'll need on our servers
  // Need to have proper key storage in GCP
  // Have to be able to do the following:
  // - mint new cards with IDs that correctly reference a metadata uri
  // - bid on behalf of USD bidders
  // - transfer ownership of cards

  const cardAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const Card = await ethers.getContractFactory('CellCard');
  const card = await Card.attach(cardAddress);
  console.log('card', card);

  const auctionAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const Auction = await ethers.getContractFactory('CSCAuction');
  const auction = await Auction.attach(auctionAddress);
  console.log('auction', auction);

  //TODO: could spin up a simple express server to handle calls from the react client
  const jsonParser = bodyParser.json();

  app.get('/', function (req, res) {
    res.send('Hello World');
    req.body;
  });

  app.post('/', jsonParser, function (req, res) {
    // Simple routing for RPC on req.body
  });

  app.listen(3000);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// JSON files will be placed here: https://console.cloud.google.com/storage/browser/stembionix_csc_nfts;tab=objects?forceOnBucketsSortingFiltering=false&project=stembionix-webapp&prefix=&forceOnObjectsSortingFiltering=false
// https://storage.googleapis.com/stembionix_csc_nfts/:id
const metadata = {
  name: 'Herbie Starbelly',
  description: 'Friendly OpenSea Creature that enjoys long swims in the ocean.',
  image: 'https://storage.googleapis.com/stembionix_csc_nfts/nft_1_image.png',
  attributes: [],
};

// needed functions

// create card (image, json, call Card contract)
// create auction, manage auction lifecycle
