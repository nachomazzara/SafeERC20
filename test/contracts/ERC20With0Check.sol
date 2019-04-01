pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";


contract ERC20With0Check is ERC20 {
    function setBalance(address _holder, uint256 _amount) public {
        _mint(_holder, _amount);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_value > 0, "value must be gt 0");
        return super.transfer(_to, _value);
    }

    function transferFrom( address _from, address _to, uint256 _value) 
    public returns (bool) 
    {
        require(_value > 0, "value must be gt 0");
        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_value > 0, "value must be gt 0");
        return super.approve(_spender, _value);
    }
}