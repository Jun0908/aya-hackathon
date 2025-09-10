// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Like {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SimpleVault {
    IERC20Like public token; // 扱うトークン
    mapping(address => uint256) public balances;

    constructor(address _token) {
        token = IERC20Like(_token);
    }

    // 預け入れ
    function deposit(uint256 amount) external {
        require(amount > 0, "amount = 0");
        // ユーザーがapproveしてから呼ぶ
        require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        balances[msg.sender] += amount;
    }

    // 引き出し
    function withdraw(uint256 amount) external {
        require(amount > 0, "amount = 0");
        require(balances[msg.sender] >= amount, "not enough balance");
        balances[msg.sender] -= amount;
        require(token.transfer(msg.sender, amount), "transfer failed");
    }
}
