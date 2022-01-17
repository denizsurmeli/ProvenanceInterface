const HDWalletProvider = require("@truffle/hdwallet-provider");

var Provenance = artifacts.require("./Provenance.sol");
var LegalEntityVerification = artifacts.require("./LegalEntityVerification.sol");

module.exports = async (deployer,accounts) =>{
  await deployer.deploy(LegalEntityVerification,{from:'0xC6Ed91d0aCb4141A23A08f99282EA06641Ef7B79'});
  await deployer.deploy(Provenance,"TestFactory","TST",LegalEntityVerification.address,{from:'0x84BA9C41987D77866BD2c42b70b74497854478AF'});
}
