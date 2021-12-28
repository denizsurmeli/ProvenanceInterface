const HDWalletProvider = require("@truffle/hdwallet-provider");
const path = require("path");
require("dotenv").config({path:"./.env"});

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    rinkeby:{
      provider:()=>{
        return new HDWalletProvider(process.env.MNEMONIC,process.env.INFURA_RINKEBY_URL,0)
      },
      network_id:"*"
    },
    fuji:{
      provider:()=>{
        return new HDWalletProvider(process.env.MNEMONIC,process.env.AVALANCHE_FUJI_TESTNET_URL,0)
      },
      network_id:"*"
    },
    ganache:{
      provider:()=>{
        return new HDWalletProvider(process.env.MNEMONIC,process.env.GANACHE_URL,0);
      },
      network_id:5777
    }
  },
  compilers:{
    solc:{
      version:"^0.8.5"
    }
  }
};
