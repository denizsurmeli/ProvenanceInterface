// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

/// @title Legal Entity Verification
/// @author Deniz Surmeli
/// @author Doğukan Türksoy
/// @notice Use it only for simulation.
/// @dev It's used in ./Provenance.sol contract for address authorization 

contract LegalEntityVerification {
    /// @notice Verified addresses will return true.
    mapping(address=>bool) verifiedAddresses;

    /// @notice Deployer of the contract will be stored here for later checkings.
    address public stateAuthority;

    event AccountVerified(address _address);
    event AccountUnverified(address _address);

    constructor(){
        stateAuthority = msg.sender;
    }

    /// @notice Only state authority can perform actions.
    /// @param _address Address to be queried.
    modifier onlyStateAuthority(address _address){
        require(_address == msg.sender,"Caller is not the state authority.");
        _;
    }
    /// @notice Only non-verified addresses can perform actions.
    /// @param _address Address to be queried.
    modifier onlyNonVerified(address _address){
        require(!(verifiedAddresses[_address]),"Address is already verified.");
        _;
    }

    modifier onlyVerified(address _address){
        require(verifiedAddresses[_address],"Address is already non-verified.");
        _;
    }

    /// @notice Verify an address.
    /// @param _address address to be verified. 
    function verify(address _address) onlyStateAuthority(msg.sender) onlyNonVerified(_address) public {
        verifiedAddresses[_address] = true;
        emit AccountVerified(_address);
    }

    function unverify(address _address) onlyStateAuthority(msg.sender) onlyVerified(_address) public{
        verifiedAddresses[_address] = false;
        emit AccountUnverified(_address);
    }
    
    /// @notice Query the verification of an address.
    /// @param _address address to be queried.
    /// @return A bool whether the address is verified or not. 
    function isVerified(address _address) public view returns(bool){
        return verifiedAddresses[_address];
    }

    /// @notice Address of the state authority.
    /// @return Address of the state authority.
    function getStateAuthorityAddress() public view returns(address){
        return stateAuthority;
    }
}