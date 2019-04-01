const BN = web3.utils.BN
const expect = require('chai').use(require('bn-chai')(BN)).expect

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

      await erc20.setBalance(testerContract.address, web3.utils.toWei('10'))

      let testerContractBalance = await erc20.balanceOf(testerContract.address)
      expect(testerContractBalance).to.eq.BN(web3.utils.toWei('10'))

      let holderBalance = await erc20.balanceOf(anotherHolder)
      expect(holderBalance).to.eq.BN('0')

      await testerContract.doTransfer(anotherHolder, web3.utils.toWei('1'))

      testerContractBalance = await erc20.balanceOf(testerContract.address)
      expect(testerContractBalance).to.eq.BN(web3.utils.toWei('9'))

      holderBalance = await erc20.balanceOf(anotherHolder)
      expect(holderBalance).to.eq.BN(web3.utils.toWei('1'))
    })

    it('should transferFrom', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)

      await erc20.setBalance(holder, web3.utils.toWei('10'))

      let testerContractBalance = await erc20.balanceOf(testerContract.address)
      expect(testerContractBalance).to.eq.BN('0')

      let holderBalance = await erc20.balanceOf(holder)
      expect(holderBalance).to.eq.BN(web3.utils.toWei('10'))

      let anotherHolderBalance = await erc20.balanceOf(anotherHolder)
      expect(anotherHolderBalance).to.eq.BN('0')

      await erc20.approve(
        testerContract.address,
        web3.utils.toWei('10'),
        fromHolder
      )

      await testerContract.doTransferFrom(
        holder,
        anotherHolder,
        web3.utils.toWei('1')
      )

      testerContractBalance = await erc20.balanceOf(testerContract.address)
      expect(testerContractBalance).to.eq.BN('0')

      holderBalance = await erc20.balanceOf(holder)
      expect(holderBalance).to.eq.BN(web3.utils.toWei('9'))

      anotherHolderBalance = await erc20.balanceOf(anotherHolder)
      expect(anotherHolderBalance).to.eq.BN(web3.utils.toWei('1'))
    })

    it('should approve', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)

      let holderAllowance = await erc20.allowance(
        testerContract.address,
        holder
      )
      expect(holderAllowance).to.eq.BN(0)

      await testerContract.doApprove(holder, web3.utils.toWei('10'))

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      expect(holderAllowance).to.eq.BN(web3.utils.toWei('10'))

      //@nacho TODO: Uncomment this when clear and approve will be done

      // await testerContract.doApprove(holder, web3.utils.toWei('100'))

      // holderAllowance = await erc20.allowance(testerContract.address, holder)
      // expect(holderAllowance).to.eq.BN(web3.utils.toWei('10'))
    })

    it('should clearApprove', async function() {
      erc20 = await ERC20Token.new(creationParams)
      testerContract = await TesterContract.new(erc20.address, creationParams)
      let holderAllowance = await erc20.allowance(
        testerContract.address,
        holder
      )
      expect(holderAllowance).to.eq.BN('0')

      await testerContract.doApprove(holder, web3.utils.toWei('10'))

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      expect(holderAllowance).to.eq.BN(web3.utils.toWei('10'))

      await testerContract.doClearApprove(holder)

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      expect(holderAllowance).to.eq.BN(cleanApproveValue)

      await testerContract.doClearApprove(holder)

      holderAllowance = await erc20.allowance(testerContract.address, holder)
      expect(holderAllowance).to.eq.BN(cleanApproveValue)
    })
  }
})
