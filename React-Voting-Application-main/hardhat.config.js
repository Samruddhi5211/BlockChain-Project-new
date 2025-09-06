/**
* @type import('hardhat/config').HardhatUserConfig
*/

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

// const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
   solidity: "0.8.11",
   defaultNetwork: "volta",
   networks: {
      hardhat: {},
      volta: {
         url:"http://127.0.0.1:8545",
         accounts: [`0x11dc81c6eba59ce0cafd4fc36a2eac5123c66ab836448f38d0263c794db5c698`],
         gas: 210000000,
         gasPrice: 800000000000,
      }
   },
}