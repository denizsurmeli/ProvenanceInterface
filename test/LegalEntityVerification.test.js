const legalEntityVerification = artifacts.require("LegalEntityVerification");

contract("LegalEntityVerification",async (accounts)=>{
    let addressToBeVerified;
    let _legalEntityVerification;
    beforeEach(async ()=>{
        // A target address that we will verify
        addressToBeVerified = accounts[1];
        // Deploy an instance of the contract
        _legalEntityVerification = await legalEntityVerification.new();
    })
    it("should verify an address that is not verified",async ()=>{
        //Check whether the address is verified.
        assert(!(await _legalEntityVerification.isVerified(addressToBeVerified)),"Address is already verified !");

        //After checking, try verifying the address.
        await _legalEntityVerification.verify(addressToBeVerified);
        assert(await _legalEntityVerification.isVerified(addressToBeVerified),"The address is not verified !");
    });

    it("should correctly return that whether an address is verified or not",async ()=>{
        //Return an address if verified or not.
        await _legalEntityVerification.verify(addressToBeVerified);
        assert.equal(true,await _legalEntityVerification.isVerified(addressToBeVerified),"isVerified() should have returned true!");

    });
})
