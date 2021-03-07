// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.0;

import './Token.sol'; // import Token SC

contract EthSwap {
  string public name = "EthSwap Instant Exchange";
  Token public token; // variable for Token SC
  uint256 public rate = 100; // redemption rate per ETH

  event TokensPurchased(
    address account,
    address token,
    uint256 amount,
    uint256 rate
  );

    event TokensSold(
    address account,
    address token,
    uint256 amount,
    uint256 rate
  );

  constructor(Token _token) public {
    token = _token;
  }

  function buyTokens() public payable {
    uint256 tokenAmount = msg.value * rate; // takes the value multiplies by rate
    require(token.balanceOf(address(this)) >= tokenAmount); // checks EthSwap has enough tokens to complete the trade
    token.transfer(msg.sender, tokenAmount); // calls function from Token SC ERC20
    // emits the purchase event
    emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
  }

  function sellTokens(uint256 _amount) public {
    // user cannot sell more tokens than they have
    require(token.balanceOf(msg.sender) >= _amount);
    // calculates the sale rate
    uint256 ethAmount = _amount / rate;
    require(address(this).balance >= ethAmount); // checks EthSwap has enough ETH to handle request
    token.transferFrom(msg.sender, address(this), _amount); // calls function from Token SC ERC20
    msg.sender.transfer(ethAmount);
    // emits the sale event
    emit TokensSold(msg.sender, address(token), ethAmount, rate);
  }
}