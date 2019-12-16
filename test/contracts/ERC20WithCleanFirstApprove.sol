pragma solidity ^0.5.12;

import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";


contract ERC20WithCleanFirstApprove is ERC20 {
    function setBalance(address _holder, uint256 _amount) public {
        _mint(_holder, _amount);
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(
            _value == 0 ||
            super.allowance(msg.sender, _spender) == 0,
            ""
        );
        super.approve(_spender, _value);
    }
}
