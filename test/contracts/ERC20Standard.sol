pragma solidity ^0.5.12;

import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";


contract ERC20Standard is ERC20 {
    function setBalance(address _holder, uint256 _amount) public {
        _mint(_holder, _amount);
    }
}
