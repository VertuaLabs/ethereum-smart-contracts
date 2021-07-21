import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "hardhat-tracer";
import "hardhat-watcher";

import { task } from "hardhat/config";

import secrets from "./keys/secrets.json";

// import "@typechain/hardhat";
const ALCHEMY_API_KEY = 'yPs01bk9k3Ki_oX-tYFxnYYeScv5Z4zc';

// Replace this private key with your Ropsten account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Be aware of NEVER putting real Ether into testing accounts
// TODO: Using just a single test account, but probably better to do the way suggested here <https://docs.openzeppelin.com/learn/connecting-to-public-test-networks>
const ROPSTEN_PRIVATE_KEY = secrets.primaryTestWallet.privateKey;
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const settings = {
  solidity: '0.8.6',
  networks: {
    ropsten: {
      // url: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      url: secrets.infura.endpoint,
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
    },
  },
  mocha: {
    timeout: 600000, //10 min timeout
  },
  watcher: {
    compilation: {
      tasks: ['compile'],
      files: ['./contracts'],
    },
    test: {
      tasks: [{ command: 'test' }, { params: { logs: true } }],
      files: ['./test'],
    },
  },
  // FIXME:
  // typechain: {
  //   outDir: "src/types",
  //   target: "ethers-v5",
  //   alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  // },
};
export default settings;

// task action function receives the Hardhat Runtime Environment as second argument
task('accounts', 'Prints accounts', async (_, { web3 }) => {
  console.log(await web3.eth.getAccounts());
});
