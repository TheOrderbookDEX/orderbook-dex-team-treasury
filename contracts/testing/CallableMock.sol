// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

contract CallableMock {
    event Called(address sender, bytes data, uint256 value);

    error Fail();

    bytes4 constant FAIL_SIG = bytes4(keccak256("fail()"));

    fallback() external payable {
        if (bytes4(msg.data) == FAIL_SIG) {
            revert Fail();
        }
        emit Called(msg.sender, msg.data, msg.value);
    }
}
