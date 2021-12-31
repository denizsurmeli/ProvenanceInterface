import React, { Component } from "react";
import LegalEntityVerification from "./contracts/LegalEntityVerification.json";
import Provenance from "./contracts/Provenance.json";
import getWeb3 from "./getWeb3";


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
    provenanceChairman:'',
    isUserLEVChairman:false,
    isUserProvenanceChairman:false,
    toBeVerifiedAccount:"",
    isVerifySuccessful:false,
    toBeUnverifiedAccount:"",
    isUnverifySuccessful:false,
    queriedAccount:null,
    zipCode:null,
    isMinted:false,
    sendTo:null,
    tokenId:null,
    isTransferSuccessful:false,
    tokenToBeApproved:0,
    isOwner:null,
    isApprovalSuccessful:false,
    accountOwnedTokenIds:[],
    awaitingApprovals:[],
    currentCirculatingTokenCount:0,
    queryAccount:null
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
  
      let provenanceChairman = await this.state.provenanceInstance.methods.getFactoryAddress().call();
      provenanceChairman = provenanceChairman.toLowerCase();

      let isLEVChairman = false;
      let isProvenanceChairman = false;

      if(legalEntityChairman === this.state.accounts[0]){
        isLEVChairman = true;
      }
      if(provenanceChairman === this.state.accounts[0]){
        isProvenanceChairman = true;
      }

      let currentSupply = await this.state.provenanceInstance.methods.serialId().call();
      this.setState({
        LEVChairman:legalEntityChairman,
        provenanceChairman:provenanceChairman,
        isUserLEVChairman:isLEVChairman,
        isUserProvenanceChairman:isProvenanceChairman,
        currentCirculatingTokenCount:parseInt(currentSupply)
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
    if(this.state.provenanceChairman === this.state.accounts[0]){
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
      console.log(this.state.toBeUnverifiedAccount);
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

  handleMint = async ()=>{
    try{
      await this.state.provenanceInstance.methods.mintProductToken(this.state.zipCode).send({from:this.state.accounts[0]});
      this.setState({
        zipCode:null,
        isMinted:true,
      });
    }catch(err){
      alert("Something went wrong with the minting process.");
      this.setState({
        zipCode:null,
        isMinted:false,
      });
      console.error(err);
    }
  }

  handleTransfer = async () =>{
    try{
      await this.state.provenanceInstance.methods.transferToken(this.state.accounts[0],this.state.sendTo,parseInt(this.state.tokenId)).send({
        from:this.state.accounts[0]
      });
      this.setState({
        sendTo:null,
        tokenId:null,
        isTransferSuccessful:true
      });
    }catch(err){
      alert("Something went wrong while sending the token. Please check the fields.");
      this.setState({
        isTransferSuccessful:false
      });
      console.error(err);
    }
  }
  handleApproveOwnership = async ()=>{
    try{
      let ownerOfTheToken = await this.state.provenanceInstance.methods.ownerOf(this.state.tokenToBeApproved).call();
      ownerOfTheToken = ownerOfTheToken.toLowerCase();

      if(this.state.accounts[0] === ownerOfTheToken){
        this.setState({
          isOwner:true
        })
        try{
          await this.state.provenanceInstance.methods.approveOwnership(this.state.tokenId).send({
            from:this.state.accounts[0]
          });
          this.setState({
            isOwner:null,
            isApprovalSuccessful:true
          });
        }catch(err){
          alert("Something went wrong while approving the token ownership.");
          this.setState({
            isApprovalSuccessful:false
          })
          console.error(err);
        }
      }else{
        this.setState({
          isOwner:false
        })
      }

    }catch(err){
      alert("Something went wrong while interacting with the contract.");
      console.error(err);
    }
  }

  handleApproveInput = async (e)=>{
    this.setState({tokenToBeApproved:parseInt(e.target.value)});
    let ownerOfTheToken = await this.state.provenanceInstance.methods.ownerOf(this.state.tokenToBeApproved).call();
    ownerOfTheToken = ownerOfTheToken.toLowerCase();

    if(this.state.accounts[0] === ownerOfTheToken){
      this.setState({
        isOwner:true
      })
    }else{
      this.setState({
        isOwner:false
      })
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
        <div className="container">
          <p>You are in the wrong network.Change you network.</p>
        </div>
      )
    }
    //Else, get here, main app. 
    return(
    <div className="container-fluid">
      <div className="mx-auto border rounded p-3" style={{
        width:'50%'
      }}>
        <div>
          <h2>Supply Chain Project</h2>
          <p><b>Legal Entity Chairman:</b> {this.state.LEVChairman}</p>
          <p><b>Provenance Chairman:</b> {this.state.provenanceChairman}</p>
          <p><b>Current circualting supply:</b>{this.state.currentCirculatingTokenCount}</p>
        </div>
      </div>

      <div className="row">
        <div className="col border rounded p-3">
        <div>
          <h3>Legal Entity Verification Operations</h3>
          <div style={{display:(this.state.isUserLEVChairman ? 'block':'none')}}>
          <label for="accountString">Verify Account</label>
              <div className="input-group mb-3">
                <input className="form-control" type="text" onChange={(e)=>this.setState({toBeVerifiedAccount:e.target.value})}></input>
                <button className= "btn btn-primary" type="button" onClick={this.handleLEVVerify}>Click to verify!</button>
                {this.state.isVerifySuccessful ? alert("Verification Successful"):null}
              </div>
              <label>Unverify Account</label>
              <div className="input-group mb-3">
                <input className="form-control" type="text" onChange={(e)=>this.setState({toBeUnverifiedAccount:e.target.value})}></input>
                <button className= "btn btn-primary" type="button" onClick={this.handleLEVUnverify}>Click to unverify!</button>
                {this.state.isUnverifySuccessful ? alert("Unverification Successful"):null}
              </div>
          </div>
          <label>Is account verified:</label>
          <div className="input-group mb-3">
            <input className="form-control" type="text" onChange={(e)=>this.setState({queryAccount:e.target.value})}></input>
            <button className= "btn btn-primary" type="button" onClick={}>Query</button>
            
          </div>
            </div>
            <div>
              <h3>Provenance Operations</h3>
              <div style={{display:(this.state.isUserProvenanceChairman ? 'block':'none')}} >
                <label>Zip Code:</label>
                <div className="input-group mb-3">
                  <input className="form-control" type="number" onChange={(e)=>this.setState({zipCode:e.target.value})}></input>
                  <button className="btn btn-primary" 
                  type="button" onClick={this.handleMint}>Click to mint token.</button>
                  <p style={{display:(this.state.isMinted) ? 'block':'none'}}>Token minted !</p>
                </div>
              </div>
              <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">Sending To,TokenId</span>
              </div>
                <input className="form-control" type="text" onChange={(e)=>this.setState({sendTo:e.target.value})}></input>
                <input className="form-control" type="number" onChange={(e)=>this.setState({tokenId:e.target.value})}></input>
                <button className="btn btn-primary" type="button" onClick={this.handleTransfer}>Send Token!</button>
              </div>
              <label>Approve token</label>
              <div className="input-group mb-3">
                <input className="form-control" type="number" onChange={this.handleApproveInput}></input>
                <button className="btn btn-primary" type="button" value={this.state.isOwner ? "Enabled":"Disabled"} onClick={this.handleApproveOwnership}>Approve Ownership !</button>
              </div>
            </div>
        </div>
        <div className="col border rounded p-3">
            <h3>Account Operations</h3>
            <p><b>Your current account:</b> {this.state.accounts[0]}</p>
            <p><b>Your current owned tokenId's</b></p>
            <div>
              <p>{this.state.accountOwnedTokenIds.length === 0 ?'You currently own no token.':'Your current token Ids:'}</p>
              <ul display={(this.state.accountOwnedTokenIds.length !== 0).toString()} className="list-group">
                {
                  this.state.accountOwnedTokenIds.map((e)=>{
                    return <li key={e} className="list-group-item">{e}</li>})
                }
              </ul> 
            </div>
        </div>
        </div>
      </div>
    );
  }
}





export default App;
