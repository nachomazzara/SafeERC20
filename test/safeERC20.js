const BigNumber = web3.BigNumber
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const ERC20 = artifacts.require('ERC20Standard')
const ERC20WithTransferWithDifferentSignature = artifacts.require(
  'ERC20WithTransferWithDifferentSignature'
)
const ERC20WithoutRevert = artifacts.require('ERC20WithoutRevert')
const ERC20WithCleanFirstApprove = artifacts.require(
  'ERC20WithCleanFirstApprove'
)
const ERC20With0Check = artifacts.require('ERC20With0Check')
const TesterContract = artifacts.require('TesterContract')

contract('LANDAuction', function([_, owner, holder, anotherHolder]) {
  let testerContract
  let erc20

  const fromOwner = { from: owner }
  const fromHolder = { from: holder }

  const creationParams = {
    ...fromOwner,
    gas: 6e6,
    gasPrice: 21e9
  }

  describe('ERC20 Standard', function() {
    doTest(ERC20)
  })

  describe('ERC20 without returning value at transfer', function() {
    doTest(ERC20WithTransferWithDifferentSignature)
  })

  describe('ERC20 with check 0', function() {
    doTest(ERC20With0Check, 1)
  })

  describe('ERC20 no reverts', function() {
    doTest(ERC20WithoutRevert)
  })

  describe('ERC20 with clean-first approve', function() {
    doTest(ERC20WithCleanFirstApprove)
  })

  function doTest(ERC20Token, cleanApproveValue = 0) {
    it('should transfer', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)

      await erc20.setBalance(testerContract.address, web3.toWei(10, 'ether'))

      let testerContractBalance = await erc20.balanceOf(testerContract.address)
      testerContractBalance.should.be.bignumber.equal(web3.toWei(10, 'ether'))

      let holderBalance = await erc20.balanceOf(anotherHolder)
      holderBalance.should.be.bignumber.equal(web3.toWei(0, 'ether'))

      await testerContract.doTransfer(anotherHolder, web3.toWei(1, 'ether'))

      testerContractBalance = await erc20.balanceOf(testerContract.address)
      testerContractBalance.should.be.bignumber.equal(web3.toWei(9, 'ether'))

      holderBalance = await erc20.balanceOf(anotherHolder)
      holderBalance.should.be.bignumber.equal(web3.toWei(1, 'ether'))
    })

    it('should transferFrom', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)

      await erc20.setBalance(holder, web3.toWei(10, 'ether'))

      let testerContractBalance = await erc20.balanceOf(testerContract.address)
      testerContractBalance.should.be.bignumber.equal(0)

      let holderBalance = await erc20.balanceOf(holder)
      holderBalance.should.be.bignumber.equal(web3.toWei(10, 'ether'))

      let anotherHolderBalance = await erc20.balanceOf(anotherHolder)
      anotherHolderBalance.should.be.bignumber.equal(web3.toWei(0, 'ether'))

      await erc20.approve(
        testerContract.address,
        web3.toWei(10, 'ether'),
        fromHolder
      )

      await testerContract.doTransferFrom(
        holder,
        anotherHolder,
        web3.toWei(1, 'ether')
      )

      testerContractBalance = await erc20.balanceOf(testerContract.address)
      testerContractBalance.should.be.bignumber.equal(0)

      holderBalance = await erc20.balanceOf(holder)
      holderBalance.should.be.bignumber.equal(web3.toWei(9, 'ether'))

      anotherHolderBalance = await erc20.balanceOf(anotherHolder)
      anotherHolderBalance.should.be.bignumber.equal(web3.toWei(1, 'ether'))
    })

    it('should approve', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)

      let holderAllowance = await erc20.allowance(
        testerContract.address,
        holder
      )
      holderAllowance.should.be.bignumber.equal(0)

      await testerContract.doApprove(holder, web3.toWei(10, 'ether'))

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      holderAllowance.should.be.bignumber.equal(web3.toWei(10))

      //@nacho TODO: Uncomment this when clear and approve will be done

      // await testerContract.doApprove(holder, web3.toWei(100, 'ether'))

      // holderAllowance = await erc20.allowance(testerContract.address, holder)
      // holderAllowance.should.be.bignumber.equal(web3.toWei(100))
    })

    it('should clearApprove', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)
      let holderAllowance = await erc20.allowance(
        testerContract.address,
        holder
      )
      holderAllowance.should.be.bignumber.equal(0)

      await testerContract.doApprove(holder, web3.toWei(10, 'ether'))

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      holderAllowance.should.be.bignumber.equal(web3.toWei(10))

      await testerContract.doClearApprove(holder)

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      holderAllowance.should.be.bignumber.equal(cleanApproveValue)

      await testerContract.doClearApprove(holder)

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      holderAllowance.should.be.bignumber.equal(cleanApproveValue)
    })
  }
})
