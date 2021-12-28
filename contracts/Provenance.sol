// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

//solhint-disable-next-line
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LegalEntityVerification.sol";

/**
    Features:
    -> Manufacturer mints a token representing the product.
    -> Hash of the serial number, zip code of the factory will
    be included in the Product struct.
    -> When the product is given to next entity, the transfer function
    will be called and the ownership will be transfered to the next owner.
    -> It should be possible to trace the output to its original 
    manifacturer.

    Time |t=0 ->                                      -> t=t
    -------------------------------------------------------
    Owner|Factory -mints-> A1 -transfer-> A2 -transfer-> A3
    //TODO: Redo this part.
    Origin of A3: Factory then. You can trace the transfers in the contract data.

    //TODO: Refactor that there may be several factories, add functions corresponding to that.
 */


/// @title Provenance tracking system for manifactured items using ERC721-tokens.
/// @author Deniz Surmeli
/// @author Doğukan Türksoy
/// @notice Use it only for simulation
/// @dev Contract is a ERC721 implementation.
contract Provenance is ERC721{
    /// @notice The production process is serialized, thus we will use this
    /// field as a counter.
    uint256 public serialId = 0;
    /// @notice The deployer of the contract will be the factory. It's the only entity that can mint. 
    address public factory;
    /// @notice Observe that we need to store the deployed address in order to call functions from it.
    address public legalEntityContractAddress;

    /// @notice For structured information.
    struct Product{
        bytes32 _serialHash; //hash of the serial id. 
        uint256 _manufacturerZipCode; //zip code of the manufacturer. In fact, this is a constant. 
    }

    /// @notice Emits when tokens are transferred.
    event TokenTransferred(uint256 tokenId,address from,address to);

    /// @notice Emits when an owner approves the ownership.
    event TokenApproved(uint256 tokenId,address tokenOwner);

    mapping(uint256=>Product) products;

    /// @notice We use this mapping to track the origins of the products.
    mapping(uint256=>address[]) owners;

    /// @notice We track is in approval or not.
    mapping(uint256=>bool) approvalState;

    /// @notice Only addresses that have been approved by state authority can perform actions.
    /// @param _address address to be queried. 
    modifier onlyVerifiedAddress(address _address){
        LegalEntityVerification friendContract = LegalEntityVerification(legalEntityContractAddress);
        require(friendContract.isVerified(_address),"Only verified addresses can perform actions.");
        _;
    }

    /// @notice Only tokens that have been minted can perform actions.
    /// @param _tokenId id of the token.
    modifier onlyExistentToken(uint256 _tokenId){
        require(ownerOf(_tokenId) != address(0),"Only minted tokens can be transferred.");
        _;
    }
    /// @notice Only tokens that in state of approval can perform actions
    /// @param _tokenId id of the token.
    modifier onlyNonApprovedToken(uint256 _tokenId){
        require(approvalState[_tokenId] == true);
        _;
    }

    /// @notice Only authorized addresses can perform actions.
    /// @param _address address to be queried. 
    modifier onlyAuthorized(address _address){
        require(factory == _address,"Only authorized addreses can perform actions.");
        _;
    }

    /// @notice Only the owner of the token can perform actions.
    /// @param _tokenId ID of the token to be queried against. 
    /// @param _address In query address. 
    modifier onlyOwner(uint256 _tokenId,address _address){
        require(ownerOf(_tokenId) ==  _address,"Only owner of the address can perform actions.");
        _;
    }
    
    /// @notice Constructor of the Provenance system.
    /// @param name_ name of the contract,factory name.
    /// @param symbol_ symbol of the contract,factory symbol.
    /// @param auxAddress Address of the helper contract, LegalEntityVerification.
    constructor(string memory name_,string memory symbol_,address auxAddress) ERC721(name_,symbol_) {
        factory = msg.sender;
        legalEntityContractAddress = auxAddress;
    }
    /// @notice Ownership approval function. Observe that we are going a bit offroad from ERC-721 Standard here.
    /// @param _tokenId Token that will be approved. 
    function approveOwnership(uint256 _tokenId) onlyOwner(_tokenId,msg.sender) onlyNonApprovedToken(_tokenId) public{
        owners[_tokenId].push(msg.sender);
        approvalState[_tokenId] = false;
        emit TokenApproved(_tokenId,msg.sender);
    }

    /// @notice Transfers the token with _tokenId from _from to _to.
    /// @param _from Address that is transfering.
    /// @param _to   Address to be transfered.
    /// @param _tokenId ID of the token to be transfered.
    function transferToken(address _from,address _to, uint256 _tokenId) onlyOwner(_tokenId,_from) onlyVerifiedAddress(_to) onlyExistentToken(_tokenId)  public {
        require(_to != ownerOf(_tokenId));
        _transfer(_from,_to,_tokenId);
        approvalState[_tokenId] = true;
        emit TokenTransferred(_tokenId,_from,_to);
    }
    
    /// @notice A manufacturer mints a product. Only authorized addreses can call.
    /// @dev First mint is directly to the factory. 
    function mintProductToken(uint256 _zipCode) onlyAuthorized(msg.sender) public {
        //wrap the parameters in a clearer way for code readability.
        uint256 productId = serialId;  
        uint256 manufacturerZipCode = _zipCode;
        _safeMint(msg.sender,productId); //mint the token, using the ERC721 implementation. Since the company is the minter,and only company members(see:onlyAuthorized) can call the mint, msg.sender is the first receiver automatically. 
        // build product fields and map it to the corresponding address. 

        products[productId] = Product({
            _serialHash : keccak256(abi.encodePacked(productId)),
            _manufacturerZipCode: manufacturerZipCode
        });
        
        approvalState[productId] = true;
        //auto-approve transfer for factory
        approveOwnership(productId);

        // increment the id by one since it's serialized. 
        serialId += 1; 

                 
    }

    /// @notice Fetch the origin address of the product.
    /// @param _tokenId Tokenized product data's id for indexing. 
    /// @return address of the origin manufacturer. 
    function getTheOriginAddress(uint256 _tokenId) public view returns(address){
        return owners[_tokenId][0];
    }


    /// @notice Gets the factory address.(for testing purposes)
    /// @return the factory address.
    function getFactoryAddress() public view returns(address){
        return factory;
    }

    /// @notice Gets the approval state of the token
    /// @return the token id
    function getApprovalState(uint256 _tokenId) public view returns(bool){
        return approvalState[_tokenId];
    }
    
    /// @notice Returns the list of all owners for a token.(for testing purposes)
    /// @param _tokenId tokenId to be queried.
    /// @return an array of all owners.
    function getAllOwners(uint256 _tokenId) public view returns(address[] memory){
        return owners[_tokenId];
    }
}