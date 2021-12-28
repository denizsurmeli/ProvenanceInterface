const { assert } = require("chai");

const provenance = artifacts.require("Provenance");
const legalEntityVerification = artifacts.require("LegalEntityVerification");


contract("Provenance contract", async (accounts) =>{ 
    let _legalEntityVerification;
    let levAddress;
    let _provenance;
    let factoryAddress;
    let stateAddress;

    /**
     * Before each test, create a new environment with fresh deployed contracts.
     * so that previous tests do not affect the later or current ones.
     */
    beforeEach(async ()=>{
        _legalEntityVerification = await legalEntityVerification.new(); //legal entity verification contract
        levAddress = await _legalEntityVerification.address;
        _provenance = await provenance.new("TestProvenance","TPVN",levAddress); //provenance contract
        factoryAddress = await _provenance.getFactoryAddress();
        stateAddress = await _legalEntityVerification.getStateAuthorityAddress();   
    })
    it("should mints a product token and assign it to factory address",
    async ()=>{
        //mint the token, expect that the token belongs to factory.
        await _provenance.mintProductToken(34357);
        assert.equal(factoryAddress,await _provenance.ownerOf(0),"Token should have been owned by the factory address.");
    });

    it("should transfer tokens to only verified addresses",async ()=>{
        const verifiedAddress = accounts[2];
        const unverifiedAddress = accounts[3];

        await _legalEntityVerification.verify(verifiedAddress);

        // mint two tokens for testing
        await _provenance.mintProductToken(34357);
        await _provenance.mintProductToken(34355);

        // verified address can receive the token.
        await _provenance.transferToken(factoryAddress,verifiedAddress,0);
        await _provenance.approveOwnership(0,{from:verifiedAddress});

        // unverified address will throw an error.
        try{
            await _provenance.transferToken(factoryAddress,unverifiedAddress,1);
            assert(false);
        }catch(err){
            assert(err);
        }
    });

    it("should correctly walk the path of transferred address and correctly show the origin of the token",async ()=>{
        /**
         * 
         * This test is designed for correctly transfering the tokens and observe the ownership
         * history for the token. We mint a token and run through 20 accounts to see that whether
         * we will receive any errors or not. We call the list of accounts `path` and if we can walk
         * this path without errors, this implies that our functions work as intented.
         * 
         */

        // build path 
        const path = accounts;
        // verify the accounts in the path so that we can initiate transfers.
        path.map(async a=>await _legalEntityVerification.verify(a));

        //mint a token
        await _provenance.mintProductToken(123123);

        //transfer the token, walk the path
        for(let i=0;i<path.length-1;i++){
            await _provenance.transferToken(path[i],path[i+1],0);
            await _provenance.approveOwnership(0,{from:path[i+1]});
        }

        //after walking the path, we expect the path to be same as the owner list of the token(also another path).
        let contractReturnedOwners = await _provenance.getAllOwners(0);

        // pre-check lengths so that we can catch faster if there is an error. 
        assert.equal(path.length,contractReturnedOwners.length,"Path lengths are different !");

        // by-index comparison between paths
        for(let i =0;i<path.length;i++){
            assert.equal(path[i],contractReturnedOwners[i],"Every address at index <i> must be equal !");
        };
        //lastly origin check, correctly walking the path implies this test will not fail, but for the sake of clarity.
        assert.equal(await _provenance.getTheOriginAddress(0),path[0],"Origin addresses must be equal");

    });

    it("should not transfer a non-minted token",async () =>{
        //transfer a token to some arbitrary address,expect it to throw a fail since the token does not exist.
        let account = accounts[2];
        _legalEntityVerification.verify(account);
        try{
            await _provenance.transferToken(accounts[1],account,0);
            assert(false);
        }catch(err){
            assert(err)
        }
    });

    it("should only allow the factory to mint tokens and not anyone else.",async ()=>{
        //only the factory can mint tokens
        try{
            await _provenance.mintProductToken(342342); // by default, the caller of the function is the deployer.
            assert(true);
        }catch(err){
            assert(false);
        }
        
        //any other address that calls the mint function will cause an error.
        try{
            await _provenance.mintProductToken(234,{from:accounts[3]});
            assert(false);
        }catch(err){
            assert(err);
        }
    });


    it("should not show the address in owners array if the token is not approved",async()=>{
        let account = accounts[1];

        // address workflow, if the workflow does not work as intended, throw error. 
        await _legalEntityVerification.verify(account);
        await _provenance.mintProductToken(123);
        await _provenance.transferToken(accounts[0],account,0);

        let lastOwner = await _provenance.getAllOwners[-1];
        assert(lastOwner != account,"account did not approve the token, it should not be seen as the last owner");
    });

    it("should show a two-times owner in the owner history",async()=>{
        let twoTimeOwner = accounts[3];
        let auxAdd = accounts[2];

        await _legalEntityVerification.verify(twoTimeOwner);
        await _legalEntityVerification.verify(auxAdd);

        await _provenance.mintProductToken(123854);

        await _provenance.transferToken(await _provenance.getFactoryAddress(),twoTimeOwner,0);
        await _provenance.approveOwnership(0,{from:twoTimeOwner});
        await _provenance.transferToken(twoTimeOwner,auxAdd,0);
        await _provenance.approveOwnership(0,{from:auxAdd});
        await _provenance.transferToken(auxAdd,twoTimeOwner,0);
        await _provenance.approveOwnership(0,{from:twoTimeOwner});

        let ownerHistory = await _provenance.getAllOwners(0);

        assert(twoTimeOwner == ownerHistory[1],"Owner history is corrupt.");
        assert(twoTimeOwner == ownerHistory[3],"Owner history is corrupt.");
        
    });

    it("the owner should not send the token to herself",async ()=>{
        let account = accounts[1];

        await _provenance.mintProductToken(213);
        await _legalEntityVerification.verify(account);
        await _provenance.transferToken(await _provenance.getFactoryAddress(),account,0);
        await _provenance.approveOwnership(0,{from:account});

        try{
            await _provenance.transferToken(account,account,0);
            assert(false);
        }catch(err){
            assert(err);
        }
    });
})