const HDWalletProvider = require("@truffle/hdwallet-provider");

var Provenance = artifacts.require("./Provenance.sol");
var LegalEntityVerification = artifacts.require("./LegalEntityVerification.sol");

module.exports = async (deployer) =>{
  await deployer.deploy(LegalEntityVerification);
  await deployer.deploy(Provenance,"TestFactory","TST",LegalEntityVerification.address);
}
