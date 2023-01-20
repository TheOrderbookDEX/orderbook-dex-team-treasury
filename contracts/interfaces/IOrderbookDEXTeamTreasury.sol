// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOrderbookDEXTeamTreasury as IOrderbookDEXTeamTreasury_ }
    from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbookDEXTeamTreasury.sol";
import { IOrderbook } from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbook.sol";

interface IOrderbookDEXTeamTreasury is IOrderbookDEXTeamTreasury_ {
    /**
     * A contract function call.
     */
    struct Call {
        address target;
        bytes   data;
    }

    /**
     * Event emitted when a signer is added.
     *
     * @param signer the signer added
     */
    event SignerAdded(address signer);

    /**
     * Event emitted when a signer is removed.
     *
     * @param signer the signer removed
     */
    event SignerRemoved(address signer);

    /**
     * Event emitted when a fee is changed.
     *
     * @param version the orderbook version
     * @param fee     the fee
     */
    event FeeChanged(uint32 version, uint256 fee);

    /**
     * Error thrown when calling functions that the sender has not been authorized to call.
     */
    error Unauthorized();

    /**
     * Error thrown when a function has been called after its deadline.
     */
    error AfterDeadline();

    /**
     * Error thrown when a function is called with less than the signatures required.
     */
    error NotEnoughSignatures();

    /**
     * Error thrown when a function is called with a signature by the account calling the function.
     */
    error CannotSelfSign();

    /**
     * Error thrown if signatures are not sorted by signer address.
     */
    error SignaturesOutOfOrder();

    /**
     * Error thrown when a function is called with more than one signature from the same account.
     */
    error DuplicateSignature();

    /**
     * Error thrown when a function is called with an invalid signature.
     */
    error InvalidSignature();

    /**
     * Error thrown when deploying with not enough signers.
     *
     * In other words, when signatures required is equal or larger to the amount of signers,
     * therefore it wouldn't ever be possible to provide that amount of signatures.
     */
    error NotEnoughSigners();

    /**
     * Error thrown when trying to remove a signer that is not signer.
     */
    error SignerToRemoveIsNotASigner();

    /**
     * Error thrown when trying to add a signer that is already a signer.
     */
    error SignerToAddIsAlreadyASigner();

    /**
     * Replace a signer by another.
     *
     * Only a signer can call this.
     *
     * Requires the signatures of others to execute. Signatures must be sorted by signer address.
     *
     * Signatures must follow EIP-712 spec for the following data structure:
     *
     *     ReplaceSigner(
     *       address executor,
     *       uint256 nonce,
     *       address signerToRemove,
     *       address signerToAdd,
     *       uint256 deadline
     *     )
     *
     * @param signerToRemove the signer to remove
     * @param signerToAdd    the signer to add
     * @param deadline       the timestamp until which the operation remains valid
     * @param signatures     the signatures authorizing the operation
     */
    function replaceSigner(
        address          signerToRemove,
        address          signerToAdd,
        uint256          deadline,
        bytes[] calldata signatures
    ) external;

    /**
     * Change the fee for an orderbook version.
     *
     * Only a signer can call this.
     *
     * Requires the signatures of others to execute. Signatures must be sorted by signer address.
     *
     * Signatures must follow EIP-712 spec for the following data structure:
     *
     *     ChangeFee(
     *       address executor,
     *       uint256 nonce,
     *       uint32  version,
     *       uint256 fee,
     *       uint256 deadline
     *     )
     *
     * @param version    the orderbook version
     * @param fee        the fee
     * @param deadline   the timestamp until which the operation remains valid
     * @param signatures the signatures authorizing the operation
     */
    function changeFee(
        uint32           version,
        uint256          fee,
        uint256          deadline,
        bytes[] calldata signatures
    ) external;

    /**
     * Claim fees from orderbooks.
     *
     * Only a signer can call this.
     *
     * Does not require signatures from other signers.
     *
     * It will ignore any error from attempting to claim fees from an orderbook and continue to the next orderbook.
     *
     * @param orderbooks the orderbooks from which to claim fees
     */
    function claimFees(IOrderbook[] calldata orderbooks) external;

    /**
     * Call another contract.
     *
     * Only a signer can call this.
     *
     * Requires the signatures of others to execute. Signatures must be sorted by signer address.
     *
     * Signatures must follow EIP-712 spec for the following data structure:
     *
     *     Call(
     *       address executor,
     *       uint256 nonce,
     *       address target,
     *       bytes   data,
     *       uint256 deadline
     *     )
     *
     * @param target     the contract to call
     * @param data       the call data
     * @param deadline   the timestamp until which the operation remains valid
     * @param signatures the signatures authorizing the operation
     */
    function call(
        address          target,
        bytes calldata   data,
        uint256          deadline,
        bytes[] calldata signatures
    ) external;

    /**
     * Indicates if an address is a signer.
     *
     * @param  account  the account to check
     * @return isSigner true if the account is a signer
     */
    function signers(address account) external view returns (bool isSigner);

    /**
     * How many signatures are required for an action that requires authorization.
     *
     * The executor of the action is NOT counted as a signer.
     *
     * @return signaturesRequired the amount of signatures required
     */
    function signaturesRequired() external view returns (uint256 signaturesRequired);

    /**
     * The next nonce for the execution of any of the functions which require one.
     *
     * Nonces are sequential.
     *
     * @return nonce the nonce
     */
    function nonce() external view returns (uint256 nonce);
}
