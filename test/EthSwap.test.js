const { assert } = require('chai')

const Token = artifacts.require('Token')
const EthSwap = artifacts.require('EthSwap')

require('chai')
  .use(require('chai-as-promised'))
  .should()

  function tokens(n) {
    return web3.utils.toWei(n, 'ether');
  }

contract('EthSwap', ([deployer, investor]) => { // deployer is 1st account in Ganache, investor is the 2nd account

  let token, ethSwap

  before(async () => {
    token = await Token.new()
    ethSwap = await EthSwap.new(token.address)
    await token.transfer(ethSwap.address, tokens('1000000'))
  })

  describe('EthSwap deployment', async () => {
    it('contract has a name', async () => {
      const name = await ethSwap.name()
      assert.equal(name, 'EthSwap Instant Exchange')
    })
  })

  describe('Token deployment', async () => {
    it('contract has a name', async () => {
      const name = await token.name()
      assert.equal(name, 'DApp Token')
    })

    it('contract has tokens', async () => {
      let balance = await token.balanceOf(ethSwap.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('buyTokens()', async () => {
    let result

    //purchases tokens before each test
    before(async () => {
      result = await ethSwap.buyTokens({ from: investor, value: web3.utils.toWei('1', 'ether')}) //from = msg.sender, value = msg.value
    })

    it('allows users to instantly purchase tokens from EthSwap for a fixed price', async () => {
      // checks investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('100'))
    })

    it('should decrease the EthSwap balance by the purchased amount', async () => {
      let ethSwapBalance
      // checks EthSwaptoken balance after purchase
      ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('999900'))
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('1', 'ether'))

      // checking event items to make sure event was emitted with the correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')
    })
  })

  describe('sellTokens()', async () => {
    let result
    //purchases tokens before each test
    before(async () => {
      await token.approve(ethSwap.address, tokens('100'), { from: investor }) // user to approve the SC to be able to spend tokens
      result = await ethSwap.sellTokens(tokens('100'), { from: investor }) // user sells tokens back to exchange
    })

    it('allows users to instantly sell tokens from EthSwap for a fixed price', async () => {
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))
    })

    it('should increase the EthSwap balance by the purchased amount', async () => {
      let ethSwapBalance
      // checks EthSwaptoken balance after purchase
      ethSwapBalance = await token.balanceOf(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), tokens('1000000'))
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei('0', 'Ether'))

      // checking event items to make sure event was emitted with the correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('1').toString()) // ETH amount
      assert.equal(event.rate.toString(), '100')

      // FAILURE: investor cannot sell more tokens than they currently own
      await ethSwap.sellTokens(tokens('500'), { from: investor }).should.be.rejected;

    })
  })

})