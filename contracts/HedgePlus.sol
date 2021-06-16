// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./libraries/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract HedgePlus is ERC20, Ownable {
  
  //using Math for uint256;
  using SafeMath for uint256;

  event SetLiquidityProvidersIncentivesAddress(address indexed _addr);
  event SetBurnStrategyAddress(address indexed _addr);
  event SetBurnPercent(uint256 indexed _value);
  event SetLPIncentivesPercent(uint256 indexed _value);

  //uint256 public taxPercentage = 300;

  uint256 public burnPercent = 200;

  uint256 public lpIncentivesPercent = 100;

  uint256 private constant BP_DIVISOR = 10000;

  address private _liquidityProvidersIncentivesAddr;
  address private _burnStrategyAddress;

  string  private _name_ = "HedgePlus";
  string  private _symbol_ = "HPLUS";

  uint256 private _initiaSupply = 210_000_000 * (10**18);

  constructor(
    address liquidityProvidersIncentivesAddr_,
    address burnStrategyAddress_
  ) ERC20(_name_,_symbol_) {

    require(liquidityProvidersIncentivesAddr_ != address(0), "Invalid liquidity providers incentives wallet");
    require(burnStrategyAddress_ != address(0), "Invalid burn strategy wallet");


    _liquidityProvidersIncentivesAddr = liquidityProvidersIncentivesAddr_;
    _burnStrategyAddress = burnStrategyAddress_;

    _mint(_msgSender(), _initiaSupply);

  }


  function setLiquidityProvidersIncentivesAddress(address _addr) external onlyOwner {
    
    require(_addr != address(0), "Invalid address");
    
    _liquidityProvidersIncentivesAddr = _addr;

    emit SetLiquidityProvidersIncentivesAddress(_addr);
  }



  function setBurnStrategyAddress(address _addr) external onlyOwner {
    
    require(_addr != address(0), "Invalid address");
    
    _burnStrategyAddress = _addr;

    emit SetBurnStrategyAddress(_addr);
  }

  function getTotalTax() public view returns(uint256) {
    return lpIncentivesPercent.add(burnPercent);
  }

  /**
   * update the tax percentage
   */
  function setBurnPercent(uint256 _value) external onlyOwner {
    burnPercent = _value;
    emit SetBurnPercent(_value);
  }

  function setLPIncentivesPercent(uint256 _value) external onlyOwner {
    lpIncentivesPercent = _value;
    emit SetLPIncentivesPercent(_value);
  }

  function _calculateTaxAmount(uint256 amount, uint256 taxPercent) internal pure returns (uint256) {
      return amount.mul(taxPercent).div(BP_DIVISOR);
  }


  function _transfer( address sender, address recipient, uint256 amount) override internal {

      require(sender != address(0), "Transfer from the zero address");
      require(recipient != address(0), "Transfer to the zero address");
      require(amount > 0, "Invalid transfer amount");

      require(balanceOf(sender) >= amount, "Transfer amount exceeds balance");

      uint256 totalTaxAmount = _calculateTaxAmount(amount, getTotalTax());
      uint256 tokensToTransfer = amount.sub(totalTaxAmount);

      uint256 tokensToBurn = _calculateTaxAmount(amount, burnPercent) ;
      uint256 lpIncentivesAmount = _calculateTaxAmount(amount, lpIncentivesPercent);

      //deduct user balance
      _balances[sender]  =  _balances[sender].sub(amount);

      _balances[recipient] = _balances[recipient].add(tokensToTransfer);

      //move lp incentives token 
      _balances[_liquidityProvidersIncentivesAddr] = _balances[_liquidityProvidersIncentivesAddr].add(lpIncentivesAmount);
      _balances[_burnStrategyAddress] =  _balances[_burnStrategyAddress].add(tokensToBurn);

      emit Transfer(sender, recipient, tokensToTransfer);

  } //end function


}
