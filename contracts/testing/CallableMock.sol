// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

contract CallableMock {
    event Called(address sender, bytes data, uint256 value);

    fallback() external payable {
        emit Called(msg.sender, msg.data, msg.value);
    }
}
