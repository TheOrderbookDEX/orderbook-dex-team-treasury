// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

contract CallableMock {
    event Called(address sender, bytes data);

    fallback() external {
        emit Called(msg.sender, msg.data);
    }
}
