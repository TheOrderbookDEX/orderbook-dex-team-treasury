// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOrderbookDEXTeamTreasury } from "./interfaces/IOrderbookDEXTeamTreasury.sol";
import { IOrderbook } from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbook.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

// TODO add multicall

contract OrderbookDEXTeamTreasury is IOrderbookDEXTeamTreasury, EIP712 {
    using Address for address;

    struct Fee {
        uint32  version;
        uint256 fee;
    }

    /**
     * Name. Used for EIP712 signatures.
     */
    string constant NAME = "OrderbookDEXTeamTreasury";

    /**
     * Version. Used for EIP712 signatures.
     */
    string constant VERSION = "1";

    /**
     * Accounts allowed to sign and call fund administration functions.
     */
    mapping(address => address) private _signers;

    /**
     * How many signatures are required for an action that requires authorization.
     */
    uint256 private immutable _signaturesRequired;

    /**
     * The time that has to elapse for the execution of a scheduled action.
     */
    uint256 private immutable _executionDelay;

    /**
     * The next nonce for the execution of any of the functions which require one.
     */
    uint256 _nonce;

    /**
     * The current fee applied to orderbooks of a specific version.
     */
    mapping(uint32 => uint256) _fee;

    /**
     * The current fee applied to orderbooks of a specific version.
     */
    mapping(uint32 => ScheduledFee) _scheduledFee;

    /**
     * Constructor.
     *
     * @param signers_            accounts allowed to sign and call fund administration functions
     * @param signaturesRequired_ how many signatures are required for an action that requires authorization
     * @param executionDelay_     the time that has to elapse for the execution of a scheduled action
     */
    constructor(
        address[] memory signers_,
        uint256          signaturesRequired_,
        uint256          executionDelay_
    )
        EIP712(NAME, VERSION)
    {
        if (signaturesRequired_ >= signers_.length) {
            revert NotEnoughSigners();
        }

        for (uint256 i; i < signers_.length; i++) {
            _signers[signers_[i]] = signers_[i];
            emit SignerAdded(signers_[i]);
        }

        _signaturesRequired = signaturesRequired_;
        _executionDelay = executionDelay_;
    }

    bytes32 constant REPLACE_SIGNER_TYPEHASH = keccak256(
        "ReplaceSigner("
            "address executor,"
            "uint256 nonce,"
            "address signerToRemove,"
            "address signerToAdd,"
            "uint256 deadline"
        ")"
    );

    function replaceSigner(
        address          signerToRemove,
        address          signerToAdd,
        uint256          deadline,
        bytes[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        if (_signers[signerToRemove] != signerToRemove) {
            revert SignerToRemoveIsNotASigner();
        }

        if (_signers[signerToAdd] == signerToAdd) {
            revert SignerToAddIsAlreadyASigner();
        }

        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            REPLACE_SIGNER_TYPEHASH,
            executor,
            nonce_,
            signerToRemove,
            signerToAdd,
            deadline
        )));

        checkSignatures(executor, signatures, digest);

        _nonce = nonce_ + 1;
        _signers[signerToRemove] = address(0);
        _signers[signerToAdd] = signerToAdd;

        emit SignerRemoved(signerToRemove);
        emit SignerAdded(signerToAdd);
    }

    bytes32 constant SCHEDULE_CHANGE_FEE_TYPEHASH = keccak256(
        "ScheduleChangeFee("
            "address executor,"
            "uint256 nonce,"
             "uint32 version,"
            "uint256 fee,"
            "uint256 deadline"
        ")"
    );

    function scheduleChangeFee(
        uint32           version,
        uint256          fee_,
        uint256          deadline,
        bytes[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            SCHEDULE_CHANGE_FEE_TYPEHASH,
            executor,
            nonce_,
            version,
            fee_,
            deadline
        )));

        checkSignatures(executor, signatures, digest);

        uint256 time = block.timestamp + _executionDelay;

        _nonce = nonce_ + 1;
        _scheduledFee[version] = ScheduledFee(fee_, time);

        emit FeeChangeScheduled(version, fee_, time);
    }

    bytes32 constant CHANGE_FEE_TYPEHASH = keccak256(
        "ChangeFee("
            "address executor,"
            "uint256 nonce,"
             "uint32 version,"
            "uint256 fee,"
            "uint256 deadline"
        ")"
    );

    function changeFee(
        uint32           version,
        uint256          fee_,
        uint256          deadline,
        bytes[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        if (fee_ > _fee[version]) {
            ScheduledFee memory scheduledFee_ = _scheduledFee[version];

            if (fee_ > scheduledFee_.fee) {
                revert CannotChangeFee();
            }

            if (block.timestamp < scheduledFee_.time) {
                revert CannotChangeFee();
            }
        }

        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            CHANGE_FEE_TYPEHASH,
            executor,
            nonce_,
            version,
            fee_,
            deadline
        )));

        checkSignatures(executor, signatures, digest);

        _nonce = nonce_ + 1;
        _fee[version] = fee_;
        delete _scheduledFee[version];

        emit FeeChanged(version, fee_);
    }

    function claimFees(IOrderbook[] calldata orderbooks) external onlySigner {
        for (uint256 i; i < orderbooks.length; i++) {
            try orderbooks[i].claimFees() {
                continue;
            } catch {
                continue;
            }
        }
    }

    bytes32 constant CALL_TYPEHASH = keccak256(
        "Call("
            "address executor,"
            "uint256 nonce,"
            "address target,"
              "bytes data,"
            "uint256 value,"
            "uint256 deadline"
        ")"
    );

    function call(
        address          target,
        bytes calldata   data,
        uint256          value,
        uint256          deadline,
        bytes[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            CALL_TYPEHASH,
            executor,
            nonce_,
            target,
            keccak256(data),
            value,
            deadline
        )));

        checkSignatures(executor, signatures, digest);

        _nonce = nonce_ + 1;

        target.functionCallWithValue(data, value);
    }

    function signers(address account) external view returns (bool) {
        return _signers[account] == account;
    }

    function signaturesRequired() external view returns (uint256) {
        return _signaturesRequired;
    }

    function executionDelay() external view returns (uint256) {
        return _executionDelay;
    }

    function nonce() external view returns (uint256) {
        return _nonce;
    }

    function fee(uint32 version) external view returns (uint256) {
        return _fee[version];
    }

    function scheduledFee(uint32 version) external view returns (ScheduledFee memory) {
        return _scheduledFee[version];
    }

    receive() external payable {}

    /**
     * Check the signatures used to call a function.
     *
     * @param executor   the account calling the function
     * @param signatures the signatures to check
     * @param digest     the hash for the structured data
     */
    function checkSignatures(
        address          executor,
        bytes[] calldata signatures,
        bytes32          digest
    ) internal view {
        if (signatures.length < _signaturesRequired) {
            revert NotEnoughSignatures();
        }

        address prevSigner = address(0);

        for (uint256 i; i < signatures.length; i++) {
            address signer = ECDSA.recover(digest, signatures[i]);

            if (signer < prevSigner) {
                revert SignaturesOutOfOrder();
            }

            if (signer == prevSigner) {
                revert DuplicateSignature();
            }

            if (signer == executor) {
                revert CannotSelfSign();
            }

            if (_signers[signer] != signer) {
                revert InvalidSignature();
            }

            prevSigner = signer;
        }
    }

    /**
     * Modifier for functions that can only be called by a signer.
     */
    modifier onlySigner() {
        if (_signers[msg.sender] != msg.sender) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * Modifier for functions that have a deadline.
     */
    modifier validUntil(uint256 deadline) {
        if (deadline < block.timestamp) {
            revert AfterDeadline();
        }
        _;
    }
}
