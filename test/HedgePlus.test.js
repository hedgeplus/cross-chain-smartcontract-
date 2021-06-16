// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { expect } = require('chai')
const { ether } = require('@openzeppelin/test-helpers')

describe('HedgePlus contract', function () {
  let hpContract
  const CONTRACT_NAME = 'HedgePlus'
  const SYMBOL = 'HPLUS'
  const TOTAL_SUPPLY = ether((210 * 1000 * 1000).toString())
  const NUM_DECIMALS = 18
  const BURN_PERCENT = 200
  const LP_INCENTIVE = 100
  const BP_DIVISOR = 10000
  const TAX = BURN_PERCENT + LP_INCENTIVE
  let owner, lp, burnAddr, addr1, addr2

  const netAfterTax = (amount) => {
    return amount - Math.floor((amount * TAX) / BP_DIVISOR)
  }

  const lpIncentive = (amount) => {
    return Math.floor((amount * LP_INCENTIVE) / BP_DIVISOR)
  }

  const burnAmount = (amount) => {
    return Math.floor((amount * BURN_PERCENT) / BP_DIVISOR)
  }

  beforeEach(async function () {
    // eslint-disable-next-line no-undef
    const contract = await ethers.getContractFactory(CONTRACT_NAME)
    // eslint-disable-next-line no-undef
    ;[owner, lp, burnAddr, addr1, addr2] = await ethers.getSigners()
    hpContract = await contract.deploy(lp.address, burnAddr.address)
  })

  describe('Deployment', function () {
    // If the callback function is async, Mocha will `await` it.
    it('Should set the right Owner', async function () {
      expect(await hpContract.owner()).to.equal(owner.address)
    })

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await hpContract.balanceOf(owner.address)
      expect(await hpContract.totalSupply()).to.equal(ownerBalance)
    })

    it('Should have valid Name', async function () {
      expect(await hpContract.name()).to.equal(CONTRACT_NAME)
    })

    it('Should have valid Total Supply', async function () {
      const supply = await hpContract.totalSupply()
      expect(supply.toString()).to.equal(TOTAL_SUPPLY.toString())
    })

    it('Should have valid Symbol', async function () {
      expect(await hpContract.symbol()).to.equal(SYMBOL)
    })

    it('Should have 18 Decimal Places', async function () {
      expect(await hpContract.decimals()).to.equal(NUM_DECIMALS)
    })
  })

  describe('Tax', function () {
    it('Should have the correct tax', async function () {
      const tax = await hpContract.getTotalTax()
      expect(tax).to.equal(TAX)
    })
  })

  describe('Basic Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      const transferAmount = '5000'
      await hpContract.transfer(addr1.address, transferAmount)
      const addr1Balance = await hpContract.balanceOf(addr1.address)
      expect(addr1Balance).to.equal(netAfterTax(transferAmount))
    })

    it('Should fail if sender doesn’t have enough tokens', async function () {
      const initialOwnerBalance = await hpContract.balanceOf(owner.address)
      await expect(hpContract.connect(addr2).transfer(owner.address, 1)).to.be.revertedWith(
        'Transfer amount exceeds balance'
      )

      expect(await hpContract.balanceOf(owner.address)).to.equal(initialOwnerBalance)
    })
  })

  describe('Check all balances', function () {
    const transferAmount = '5000'
    let initialOwnerBalance
    beforeEach(async function () {
      initialOwnerBalance = await hpContract.balanceOf(owner.address)
      // Transfer tokens from owner to addr1.
      await hpContract.transfer(addr1.address, transferAmount)
    })

    it('Should have deducted the correct amount from sender', async function () {
      // Check all balances
      const finalOwnerBalance = await hpContract.balanceOf(owner.address)
      const expectedBalance = initialOwnerBalance.sub(transferAmount)
      expect(finalOwnerBalance).to.equal(expectedBalance)
    })

    it('Should have send the recipient the correct amount after tax', async function () {
      // Recipient of transfer less tax
      const addr1Balance = await hpContract.balanceOf(addr1.address)
      expect(addr1Balance).to.equal(netAfterTax(transferAmount))
    })

    it('Should have send the LP incentive', async function () {
      // LP Recipient
      const lpBalance = await hpContract.balanceOf(lp.address)
      expect(lpBalance).to.equal(lpIncentive(transferAmount))
    })

    it('Should add to the burn bank', async function () {
      // Burn strategy
      const burnBalance = await hpContract.balanceOf(burnAddr.address)
      expect(burnBalance).to.equal(burnAmount(transferAmount))
    })
  })
})
