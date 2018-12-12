# SafeERC20

Library that brings an abstract layer above the [ERC20 standard interface](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/IERC20.sol) providing a way to call its methods safely by checking pre and post-conditions.

## Table of Content

1. [Interface](https://github.com/nachomazzara/SafeERC20/blob/master/README.md#interface)
2. [Usage](https://github.com/nachomazzara/SafeERC20/blob/master/README.md#usage)

## Interface

```solidity
 /**
* @dev Transfer token for a specified address
* @param _token erc20 The address of the ERC20 contract
* @param _to address The address which you want to transfer to
* @param _value uint256 the _value of tokens to be transferred
* @return bool whether the transfer was successful or not
*/
function safeTransfer(IERC20 _token, address _to, uint256 _value) internal returns (bool);


/**
* @dev Transfer tokens from one address to another
* @param _token erc20 The address of the ERC20 contract
* @param _from address The address which you want to send tokens from
* @param _to address The address which you want to transfer to
* @param _value uint256 the _value of tokens to be transferred
* @return bool whether the transfer was successful or not
*/
function safeTransferFrom(
    IERC20 _token,
    address _from,
    address _to,
    uint256 _value
) internal returns (bool) ;

/**
* @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
*
* Beware that changing an allowance with this method brings the risk that someone may use both the old
* and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
* race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
* https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
*
* @param _token erc20 The address of the ERC20 contract
* @param _spender The address which will spend the funds.
* @param _value The amount of tokens to be spent.
* @return bool whether the approve was successful or not
*/
function safeApprove(IERC20 _token, address _spender, uint256 _value) internal returns (bool)
```

## Usage

### _safeTransfer_

```solidity
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "SafeERC20.sol";


contract MyContract {
    using SafeERC20 for IERC20;

    function myMethod() {
        ...
        require(token.safeTransfer(to, value), "Transfer failed");
        ...
    }

    function myMethod2() {
        ...
        if (token.safeTransfer(to, value)) {
         // Do something on success
        }
        ...
    }
}
```

### _safeTransferFrom_

```solidity
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "SafeERC20.sol";


contract MyContract {
    using SafeERC20 for IERC20;

    function myMethod() {
        ...
        require(token.safeTransferFrom(owner, to, value), "Transfer from failed");
        ...
    }

    function myMethod2() {
        ...
        if (token.safeTransferFrom(owner, to, value)) {
         // Do something on success
        }
        ...
    }
}
```

### _safeApprove_

```solidity
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "SafeERC20.sol";


contract MyContract {
    using SafeERC20 for IERC20;

    function myMethod() {
        ...
        require(token.safeApprove(to, value), "Approve failed");
        ...
    }

    function myMethod2() {
        ...
        if (token.safeApprove(to, value)) {
         // Do something on success
        }
        ...
    }
}
```

### _clearApprove_

```solidity
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "SafeERC20.sol";


contract MyContract {
    using SafeERC20 for IERC20;

    function myMethod() {
        ...
        require(token.clearApprove(to), "Clear approval failed");
        ...
    }

    function myMethod2() {
        ...
        if (token.clearApprove(to)) {
         // Do something on success
        }
        ...
    }
}
```
