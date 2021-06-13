const { expect, asset } = require("chai");
const hre = require("hardhat")
const fs = require('fs')
const process = require("process")

const marketMakingAddress = process.env.MARKET_MAKING_ADDRESS

describe("Testing HedgePlus.sol", async function(){

    let ethers = null;
    let deployedContract = null;
    let hplusAddress;
    
    before(async function(){
        this.ethers = hre.ethers;

        const WHPLUS = await ethers.getContractFactory('WHPLUS')
        const hplusToken = await HPLUS.deploy(marketMakingAddress)
        await hplusToken.deployed()
       
        console.log('HPLUS Token deployed to:', hplusToken.address)
       
        this.hplusAddress = hplusToken.address
        
        const HedgPlus = await this.ethers.getContractFactory("HedgePlus.sol");
        const deployedContract = await this.Greeter.deploy(this.hplusAddress);

        console.log('HPLUS Token deployed to:', hplusToken.address)
    
    });   

    it("should transfer token successfully", async function(){

    });

});