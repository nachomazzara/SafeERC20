At [Decentraland](https://decentraland.org/) we wanted to sell the remaining 9,300 unowned LAND parcels that were leftovers from the first Auction that gave birth to the Genesis City. For that purpose we decided to implement it using a [dutch auction](https://en.wikipedia.org/wiki/Dutch_auction) which is more suitable for doing it on-chain.

A Dutch Auction can be thought as one in which the price decreases over time and the first bidder wins the bid.

An additional goal was to make it popular by inviting other **ERC20** to participate like BNB, ZIL, DAI, MAKER, etc. This way we could guarantee that most of the LAND will be sold during the Auction.
Also, as part of these partnerships, we decided not to keep any of the tokens but burning them all 🔥 (In the case of DAI we sent them to a charity foundation).

As an outcome of the first audit, we found out that **ERC20** tokens core methods were not standardized as we initially thought. After taking a look at different implementations we noticed _`transfer`_, _`transferFrom`_ and _`approve`_ had core differences between them. Let's take a look...

## _transfer_

### Standard

From Zeppelin [ERC20](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/ERC20.sol#L62) implementation

```solidity
function transfer(address to, uint256 value) public returns (bool) {
 _transfer(msg.sender, to, value);
 return true;
}
```

### No reverts

Tokens as [RCN](https://etherscan.io/address/0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6#code) return `false` in case the pre-conditions are false

```solidity
function transfer(address _to, uint256 _value) returns (bool success) {
 if (balances[msg.sender] >= _value) {
   balances[msg.sender] = balances[msg.sender].sub(_value);
   balances[_to] = balances[_to].add(_value);
   Transfer(msg.sender, _to, _value);
   return true;
 } else {
   return false;
 }
}
```

### Without returning value

Tokens as [BNB](https://etherscan.io/address/0xB8c77482e45F1F44dE1745F52C74426C631bDD52#code) hasn't a return value when performing a `transfer`

```solidity
function transfer(address _to, uint256 _value) {
 if (_to == 0x0) throw; // Prevent transfer to 0x0 address. Use burn() instead
 if (_value <= 0) throw;
 if (balanceOf[msg.sender] < _value) throw; // Check if the sender has enough
 if (balanceOf[_to] + _value < balanceOf[_to]) throw; // Check for overflows
 balanceOf[msg.sender] = SafeMath.safeSub(balanceOf[msg.sender], _value); // Subtract from the sender
 balanceOf[_to] = SafeMath.safeAdd(balanceOf[_to], _value); // Add the same to the recipient
 Transfer(msg.sender, _to, _value); // Notify anyone listening that this transfer took place
}
```

## _transferFrom_

### Standard

From Zeppelin [ERC20](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/ERC20.sol#L90) implementation

```solidity
function transferFrom(
   address from,
   address to,
   uint256 value
 )
   public
   returns (bool)
 {
   require(value <= _allowed[from][msg.sender]);

   _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
   _transfer(from, to, value);
   return true;
}
```

### No reverts

Tokens as [RCN](https://etherscan.io/address/0xf970b8e36e23f7fc3fd752eea86f8be8d83375a6#code) return `false` in case the pre-conditions are false

```solidity
function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
  if (balances[_from] >= _value && allowed[_from][msg.sender] >= _value) {
    balances[_to] = balances[_to].add(_value);
    balances[_from] = balances[_from].sub(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  } else {
    return false;
  }
}
```

## _approve_

### Standard

From Zeppelin [ERC20](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/ERC20.sol#L76) implementation

```solidity
function approve(address spender, uint256 value) public returns (bool) {
 require(spender != address(0));

 _allowed[msg.sender][spender] = value;
 emit Approval(msg.sender, spender, value);
 return true;
}
```

### With clean-first approach

Tokens as [MANA](https://etherscan.io/address/0x0f5d2fb29fb7d3cfee444a200298f468908cc942#code) check if the allowed balance is 0 or will be set to 0 before setting it

```solidity
function approve(address _spender, uint256 _value) returns (bool) {
   // To change the approve amount you first have to reduce the addresses`
   //  allowance to zero by calling `approve(_spender, 0)` if it is not
   //  already 0 to mitigate the race condition described here:
   //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   require((_value == 0) || (allowed[msg.sender][_spender] == 0));

   allowed[msg.sender][_spender] = _value;
   Approval(msg.sender, _spender, _value);
   return true;
 }
```

### Without clear approval

Tokens as [BNB](https://etherscan.io/address/0xB8c77482e45F1F44dE1745F52C74426C631bDD52#code) doesn't have a way to clear approvals

```solidity
function approve(address _spender, uint256 _value) returns (bool success) {
 if (_value <= 0) throw;
 allowance[msg.sender][_spender] = _value;
 return true;
}
```

We saw an opportunity to create **SafeERC20.sol** a library that brings an abstract layer above the [ERC20 standard interface](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/IERC20.sol) providing a way to call its methods safely by checking pre and post-conditions.

Also, every method returns a `bool` that could be wrapped with a `revert` call to prevent the loss of all the Ether sent as gas when a transaction fails. This is really useful for tokens developed before Solidity included the `revert` call and still use `throw` and/or `assert`.

## SafeERC20 interface

### _safeTransfer_

Perform the _`transfer`_ method from **ERC20**

- Check if the value to be transferred is lower or equal to the account balance.
- Check if account balance after the transfer is equal to previous balance minus the value transferred

```solidity
function safeTransfer(IERC20 _token, address _to, uint256 _value) internal returns (bool) {
 uint256 prevBalance = _token.balanceOf(address(this));

 if (prevBalance < _value) {
     // Insufficient funds
     return false;
 }

  address(_token).call(
     abi.encodeWithSignature("transfer(address,uint256)", _to, _value)
 );

 if (prevBalance - _value != _token.balanceOf(address(this))) {
     // Transfer failed
     return false;
 }

 return true;
}
```

### _safeTransferFrom_

Perform the _`transferFrom`_ method from **ERC20**

- Check if the value to be transferred is lower or equal to the account balance.
- Check if the value to be transferred is lower or equal to the allowance of the account which is going to perform the transfer.
- Check if account balance after the transfer is equal to previous balance minus the value transferred

```solidity
function safeTransferFrom(
       IERC20 _token,
       address _from,
       address _to,
       uint256 _value
   ) internal returns (bool)
{
 uint256 prevBalance = _token.balanceOf(_from);

 if (prevBalance < _value) {
     // Insufficient funds
     return false;
 }

 if (_token.allowance(_from, address(this)) < _value) {
     // Insufficient allowance
     return false;
 }

 address(_token).call(
     abi.encodeWithSignature("transferFrom(address,address,uint256)", _from, _to, _value)
 );

 if (prevBalance - _value != _token.balanceOf(_from)) {
     // Transfer failed
     return false;
 }

 return true;
}
```

### _safeApprove_

Perform the _`approve`_ method from **ERC20**

- Check if the allowance set is equal to the required value to approve.

```solidity
function safeApprove(IERC20 _token, address _spender, uint256 _value) internal returns (bool) {
 address(_token).call(
     abi.encodeWithSignature("approve(address,uint256)",_spender, _value)
 );

 if (_token.allowance(address(this), _spender) != _value) {
     // Approve failed
     return false;
 }

 return true;
}
```

### _clearApprove_

Method to clear approval.

Tokens as BNB don't accept 0 as a valid value for _`approve`_. So if calling _`safeApprove`_ with `0` fails, the library will try with `1 WEI`.

```solidity
function clearApprove(IERC20 _token, address _spender) internal returns (bool) {
 bool success = safeApprove(_token, _spender, 0);

 if (!success) {
     return safeApprove(_token, _spender, 1);
 }

 return true;
}
```

_[Full code](https://github.com/nachomazzara/SafeERC20/blob/master/contracts/libs/SafeERC20.sol)_

## Caveats

- Using interface methods like `transfer` will fail for tokens without returning value as BNB because since versions of **Solidity 0.4.22** the EVM has a new opcode, called `RETURNDATASIZE`. This opcode stores the size of the returned data of an external call. The code checks the size of the return value after an external call and reverts the transaction in case the return data is shorter than expected.
  You can read more about this issue [here](https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca) and also see a list of tokens with this problem (and how to do it with assembly).

- Some tokens check if you are going to _`transfer`_ a value <= 0 and throws. We decided to cover this case in the library by not checking the success of the `transfer` call, but checking the balance after performing it. So in case you want to transfer `0`, the `transfer` call will fail but the post-condition of checking the balance will succeed

- We avoid the use of `assembly` even thought consumes less gas because it is a black box for the standard Solidity developer and also error prune. This is way easier to read and understand.

Hope this will help on the standardization of most of **ERC20**, **ERC721** and other widely used standards used by the community.

With Solidity 0.5.x _`.call()`_, _`.delegatecall()`_ and _`.staticcall()`_ now return _`(bool, bytes memory)`_ to provide access to the return data. We are working on a version for this library with support for it.

Special thanks to [Agustin Aguilar](https://twitter.com/Agusx1211) who discovered the first differences between **ERC20** tokens in the audit for the [LANDAuction contract](https://github.com/decentraland/land-auction/blob/master/contracts/auction/LANDAuction.sol) and [Patricio Palladino](https://twitter.com/alcuadrado) for shedding some light about the Solidity compiler.

[Github Repo](https://github.com/nachomazzara/SafeERC20)
