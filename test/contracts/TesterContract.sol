pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "../../contracts/libs/SafeERC20.sol";


contract TesterContract {
    using SafeERC20 for IERC20;

    IERC20 public token;

    constructor(IERC20 _token) public {
        token = _token;
    }

    function doTransfer(address to, uint256 value) public {
        require(token.safeTransfer(to, value), "Transfer Failed");
    }
    
    function doTransferFrom(address from, address to, uint256 value) public {
        require(token.safeTransferFrom(from, to, value), "Transfer from Failed");
    }

    function doApprove(address spender, uint256 value) public {
        require(token.safeApprove(spender, value), "Approve Failed");
    }

    function doClearApprove(address spender) public {
        require(token.clearApprove(spender), "Clear approve failed");
    }
}