import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-web3';
import 'hardhat-tracer';
import 'hardhat-watcher';
import { task } from 'hardhat/config';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const settings = {
  solidity: '0.8.6',
  networks: {},
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
};
export default settings;

// task action function receives the Hardhat Runtime Environment as second argument
task('accounts', 'Prints accounts', async (_, { web3 }) => {
  console.log(await web3.eth.getAccounts());
});
