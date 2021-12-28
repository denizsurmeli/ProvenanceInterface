import React, { Component } from "react";
import LegalEntityVerification from "./contracts/LegalEntityVerification.json";
import Provenance from "./contracts/Provenance.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = {loaded:false,legalEntityChairman:null,provenanceChairman:null};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      this.legalEntityVerificationInstance = await new this.web3.eth.Contract(
        LegalEntityVerification.abi,
        LegalEntityVerification.networks[this.networkId] && LegalEntityVerification.networks[this.networkId].address
      );

      this.provenanceInstance = await new this.web3.eth.Contract(
        Provenance.abi,
        Provenance.networks[this.networkId] && Provenance.networks[this.networkId].address
      );

      const legalEntityChairman = await this.legalEntityVerificationInstance.methods.getStateAuthorityAddress().call();

      const provenanceChairman = await this.provenanceInstance.methods.factory().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        loaded:true,
        legalEntityChairman:legalEntityChairman,
        provenanceChairman:provenanceChairman
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Supply Chain Project</h1>
        <h3>LegalEntityVerification Chairman:{this.state.legalEntityChairman}</h3>
        <h3>Provenance Chairman:{this.state.provenanceChairman}</h3>
      </div>
    );
  }
}

export default App;
