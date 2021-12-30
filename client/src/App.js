import React, { Component } from "react";
import LegalEntityVerification from "./contracts/LegalEntityVerification.json";
import Provenance from "./contracts/Provenance.json";
import getWeb3 from "./getWeb3";

import "./App.css";


// config for rinkeby.
const CHAIN_ID = '0x4'
const NETWORK_ID = 4


class App extends Component {
  state={
    web3:null,
    loaded:false,
    legalEntityVerificationInstance:null,
    provenanceInstance:null,
    networkId:'',
    accounts:[],
    LEVChairman:'',
    provenanaceChairman:'',
    isUserLEVChairman:false,
    isUserProvenanceChairman:false,
    toBeVerifiedAccount:"",
    isVerifySuccessful:false,
    toBeUnverifiedAccount:"",
    isUnverifySuccessful:false,
    queriedAccount:null
  }

  /**
   * Call when we are in the correct network. Inject contract state 
   * 
   */
  injectContractState = async ()=>{
      let legalEntityVerificationInstance = await new this.state.web3.eth.Contract(
        LegalEntityVerification.abi,
        LegalEntityVerification.networks[this.state.networkId] && LegalEntityVerification.networks[this.state.networkId].address
      );
  
      let provenanceInstance = await new this.state.web3.eth.Contract(
        Provenance.abi,
        Provenance.networks[this.state.networkId] && Provenance.networks[this.state.networkId].address
      );

      this.setState({
        legalEntityVerificationInstance:legalEntityVerificationInstance,
        provenanceInstance:provenanceInstance,
      })
  
      let legalEntityChairman = await this.state.legalEntityVerificationInstance.methods.getStateAuthorityAddress().call();
      legalEntityChairman = legalEntityChairman.toLowerCase();
  
      let provenanceChairman = await this.state.provenanceInstance.methods.factory().call();
      provenanceChairman = legalEntityChairman.toLowerCase();
      let isLEVChairman = false;
      let isProvenanceChairman = false;
      if(legalEntityChairman === this.state.accounts[0]){
        isLEVChairman = true;
      }
      if(provenanceChairman === this.state.accounts[0]){
        isProvenanceChairman = true;
      }
      this.setState({
        LEVChairman:legalEntityChairman,
        provenanceChairman:provenanceChairman,
        isUserLEVChairman:isLEVChairman,
        isUserProvenanceChairman:isProvenanceChairman
      });
  }

  /**
   * Ask user to change the current chain their wallet is connected to.
   */
  promptChainChange = async ()=>{
    await window.ethereum.request({
      method:"wallet_switchEthereumChain",
      params:[{
        chainId:CHAIN_ID //TODO:Change this to AVALANCHE_FUJI_TESTNET.
      }]
    })
  }

  /**
   * Handle the state change after new account selection/insertion
   */
  handleAccountsChanged = async (accounts)=>{
    this.setState({
      accounts:accounts.map(account=>account.toLowerCase()),
    });
    let isLEVChairman = false;
    let isProvenanceChairman = false;
    if(this.state.LEVChairman === this.state.accounts[0]){
      isLEVChairman = true;
    }
    if(this.state.provenanaceChairman === this.state.accounts[0]){
      isProvenanceChairman = true;
    }
    this.setState({
      isUserLEVChairman:isLEVChairman,
      isUserProvenanceChairman:isProvenanceChairman
    })
  }

  /**
   * 
   * Handle the chain change. Chain-react with @promptChainChange
   */
  handleChainChanged = async (chainId)=>{
    if(chainId !== CHAIN_ID){
      this.setState({
        loaded:false
      })
      await this.promptChainChange();
      if(await this.state.web3.eth.net.getId() === NETWORK_ID){
        this.setState({
          networkId:NETWORK_ID,
          loaded:true
        })
      }
    }
  }

  handleLEVVerify = async ()=>{
    try{
      await this.state.legalEntityVerificationInstance.methods.verify(this.state.toBeVerifiedAccount).send({from:this.state.accounts[0]});
      this.setState({
        toBeVerifiedAccount:"",
        isVerifySuccessful:true
      })
    }catch(err){
      alert("Something went wrong with the verification process.");
      this.setState({
        toBeVerifiedAccount:"",
        isVerifySuccessful:false
      })
      console.error(err);

    }
  }

  handleLEVUnverify = async ()=>{
    try{
      await this.state.legalEntityVerificationInstance.methods.unverify(this.state.toBeUnverifiedAccount).send({from:this.state.accounts[0]});
      this.setState({
        toBeUnverifiedAccount:"",
        isUnverifySuccessful:true
      })
    }catch(err){
      alert("Something went wrong with the unverification process.");
      this.setState({
        toBeUnverifiedAccount:"",
        isUnverifySuccessful:false
      })
      console.error(err);
    }
  }

  async componentDidMount(){
    try{
      //get wallet provider,put it on state so we can use. If null, trigger emergencies.
      this.setState({
        web3:await getWeb3()
      });
      //handle emergency
      if(this.state.web3 === null){
        alert("Web3 provider is not found. You can't use the app. Install a wallet provider.")
      }else{
        //build the initial state. First opening, get accounts, get the current chain, after checks, inject the state.
        let tempArr = await this.state.web3.eth.getAccounts();
        tempArr = tempArr.map(account=>account.toLowerCase());
        this.setState({
          accounts:tempArr,
          networkId:await this.state.web3.eth.net.getId()
        })
        if(this.state.networkId === NETWORK_ID){
          this.injectContractState();
          this.setState({
            loaded:true
          })
        }else{
          this.promptChainChange();
        }
      }

      //listen changes regularly, if any change, use handlers.
      window.ethereum.on("accountsChanged",this.handleAccountsChanged);
      window.ethereum.on("chainChanged",this.handleChainChanged);

    //catch all non-specified error. Should left with 1-2 edge cases after full build.
    }catch(err){
      alert("OOPS! Something went wrong! Check console for further errors.");
      console.error(err);
    }
  }


  render (){
    // If the app is not loaded correctly, it's because of the network. Prompt it to user.
    if(!this.state.loaded){
      return(
        <div className="App">
          <p>You are in the wrong network.Change you network.</p>
        </div>
      )
    }
    //Else, get here, main app. 
    return(
      <div className="App">
        <h1>Supply Chain Project</h1>
        <h4>LEV Chairman:{this.state.LEVChairman}</h4>
        <h4>Provenance Chairman:{this.state.provenanceChairman}</h4>
        <h4>Your current account:{this.state.accounts[0]}</h4>
        <div style={{
          display:(this.state.isUserLEVChairman ? 'block':'none')
        }}>
          <h3>Legal Entity Verification Operations</h3>
          <form>
            <input type="text" onChange={(e)=>this.setState({toBeVerifiedAccount:e.target.value})}></input>
            <button type="button" onClick={this.handleLEVVerify}>Click to verify!</button>
            <p style={{display:(this.state.isVerifySuccessful ? 'block':'none')}}>Verification Complete.</p>
          </form>
          <form>
            <input type="text" onChange={(e)=>this.setState({toBeUnverifiedAccount:e.target.value})}></input>
            <button type="button" onClick={this.handleLEVUnverify}>Click to unverify!</button>
            <p style={{display:(this.state.isUnverifySuccessful ? 'block':'none')}}>Unverification Complete.</p>
          </form>
        </div>
        <div style={{
          display:(this.state.isUserProvenanceChairman ?'block':'none')
        }}>
          <h3>Provenance Operations</h3>
        </div>

      </div>
    );
  }
}





export default App;
