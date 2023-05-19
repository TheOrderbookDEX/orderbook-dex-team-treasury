// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import { IOrderbook } from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbook.sol";
import { IOrderbookDEXTeamTreasury }
    from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbookDEXTeamTreasury.sol";

contract OrderbookMock is IOrderbook {
    event ClaimFeesCalled();

    error Fail();

    error NotImplemented();

    bool private immutable _failClaimFees;

    constructor(bool failClaimFees) {
        _failClaimFees = failClaimFees;
    }

    function claimFees() external {
        if (_failClaimFees) {
            revert Fail();
        }
        emit ClaimFeesCalled();
    }

    function version() external pure returns (uint32) {
        revert NotImplemented();
    }

    function tradedToken() external pure returns (address) {
        revert NotImplemented();
    }

    function baseToken() external pure returns (address) {
        revert NotImplemented();
    }

    function contractSize() external pure returns (uint256) {
        revert NotImplemented();
    }

    function priceTick() external pure returns (uint256) {
        revert NotImplemented();
    }

    function askPrice() external pure returns (uint256) {
        revert NotImplemented();
    }

    function bidPrice() external pure returns (uint256) {
        revert NotImplemented();
    }

    function nextSellPrice(uint256) external pure returns (uint256) {
        revert NotImplemented();
    }

    function nextBuyPrice(uint256) external pure returns (uint256) {
        revert NotImplemented();
    }

    function treasury() external pure returns (IOrderbookDEXTeamTreasury) {
        revert NotImplemented();
    }

    function collectedFees() external pure returns (uint256, uint256) {
        revert NotImplemented();
    }
}
