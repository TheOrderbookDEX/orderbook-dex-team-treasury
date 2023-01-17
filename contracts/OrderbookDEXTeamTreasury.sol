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
    mapping(address => bool) private _signers;

    /**
     * How many signatures are required for an action that requires authorization.
     */
    uint256 private immutable _signaturesRequired;

    /**
     * The next nonce for the execution of any of the functions which require one.
     */
    uint256 _nonce;

    /**
     * The current fee applied to orderbooks of a specific version.
     */
    mapping(uint32 => uint256) _fee;

    /**
     * Constructor.
     *
     * @param signers_            accounts allowed to sign and call fund administration functions
     * @param signaturesRequired_ how many signatures are required for an action that requires authorization
     */
    constructor(address[] memory signers_, uint256 signaturesRequired_)
        EIP712(NAME, VERSION)
    {
        if (signaturesRequired_ >= signers_.length) {
            revert NotEnoughSigners();
        }

        for (uint256 i; i < signers_.length; i++) {
            _signers[signers_[i]] = true;
            emit SignerAdded(signers_[i]);
        }

        _signaturesRequired = signaturesRequired_;
    }

    bytes32 constant REPLACE_SIGNER_TYPEHASH = keccak256(
        "ReplaceSigner("
            "address signer,"
            "ReplaceSignerArgs args"
        ")"
        "ReplaceSignerArgs("
            "address executor,"
            "address signerToRemove,"
            "address signerToAdd,"
            "uint256 nonce,"
            "uint256 deadline"
        ")"
    );

    bytes32 constant REPLACE_SIGNER_ARGS_TYPEHASH = keccak256(
        "ReplaceSignerArgs("
            "address executor,"
            "address signerToRemove,"
            "address signerToAdd,"
            "uint256 nonce,"
            "uint256 deadline"
        ")"
    );

    function replaceSigner(
        address              signerToRemove,
        address              signerToAdd,
        uint256              deadline,
        Signature[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        if (!_signers[signerToRemove]) {
            revert SignerToRemoveIsNotASigner();
        }

        if (_signers[signerToAdd]) {
            revert SignerToAddIsAlreadyASigner();
        }

        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 argsHash = keccak256(abi.encode(
            REPLACE_SIGNER_ARGS_TYPEHASH,
            executor,
            signerToRemove,
            signerToAdd,
            nonce_,
            deadline
        ));

        checkSignatures(executor, signatures, REPLACE_SIGNER_TYPEHASH, argsHash);

        _nonce = nonce_ + 1;
        _signers[signerToRemove] = false;
        _signers[signerToAdd] = true;

        emit SignerRemoved(signerToRemove);
        emit SignerAdded(signerToAdd);
    }

    bytes32 constant CHANGE_FEE_TYPEHASH = keccak256(
        "ChangeFee("
            "address signer,"
            "ChangeFeeArgs args"
        ")"
        "ChangeFeeArgs("
            "address executor,"
            "uint32 version,"
            "uint256 fee,"
            "uint256 nonce,"
            "uint256 deadline"
        ")"
    );

    bytes32 constant CHANGE_FEE_ARGS_TYPEHASH = keccak256(
        "ChangeFeeArgs("
            "address executor,"
            "uint32 version,"
            "uint256 fee,"
            "uint256 nonce,"
            "uint256 deadline"
        ")"
    );

    function changeFee(
        uint32               version,
        uint256              fee_,
        uint256              deadline,
        Signature[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        // TODO fee changes that increase fee must be timelocked

        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 argsHash = keccak256(abi.encode(
            CHANGE_FEE_ARGS_TYPEHASH,
            executor,
            version,
            fee_,
            nonce_,
            deadline
        ));

        checkSignatures(executor, signatures, CHANGE_FEE_TYPEHASH, argsHash);

        _nonce = nonce_ + 1;
        _fee[version] = fee_;
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
            "address signer,"
            "CallArgs args"
        ")"
        "CallArgs("
            "address executor,"
            "address target,"
            "bytes data,"
            "uint256 nonce,"
            "uint256 deadline"
        ")"
    );

    bytes32 constant CALL_ARGS_TYPEHASH = keccak256(
        "CallArgs("
            "address executor,"
            "address target,"
            "bytes data,"
            "uint256 nonce,"
            "uint256 deadline"
        ")"
    );

    function call(
        address              target,
        bytes calldata       data,
        uint256              deadline,
        Signature[] calldata signatures
    ) external onlySigner validUntil(deadline) {
        address executor = msg.sender;
        uint256 nonce_ = _nonce;
        bytes32 argsHash = keccak256(abi.encode(
            CALL_ARGS_TYPEHASH,
            executor,
            target,
            data,
            nonce_,
            deadline
        ));

        checkSignatures(executor, signatures, CALL_TYPEHASH, argsHash);

        _nonce = nonce_ + 1;

        target.functionCall(data);
    }

    function signers(address account) external view returns (bool) {
        return _signers[account];
    }

    function signaturesRequired() external view returns (uint256) {
        return _signaturesRequired;
    }

    function nonce() external view returns (uint256) {
        return _nonce;
    }

    function fee(uint32 version) external view returns (uint256) {
        return _fee[version];
    }

    /**
     * Check the signatures used to call a function.
     *
     * @param executor   the account calling the function
     * @param signatures the signatures to check
     * @param typeHash   the hash for the structured data type
     * @param argsHash   the struct hash for the arguments used to call the function
     */
    function checkSignatures(
        address              executor,
        Signature[] calldata signatures,
        bytes32              typeHash,
        bytes32              argsHash
    ) internal view {
        if (signatures.length < _signaturesRequired) {
            revert NotEnoughSignatures();
        }

        for (uint256 i; i < signatures.length; i++) {
            address signer = signatures[i].signer;

            if (signer == executor) {
                revert CannotSelfSign();
            }

            if (!_signers[signer]) {
                revert ExtraneousSignature();
            }

            for (uint256 j; j < i; j++) {
                if (signer == signatures[j].signer) {
                    revert DuplicateSignature();
                }
            }

            bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
                typeHash,
                signer,
                argsHash
            )));

            if (signer != ECDSA.recover(digest, signatures[i].signature)) {
                revert InvalidSignature();
            }
        }
    }

    /**
     * Modifier for functions that can only be called by a signer.
     */
    modifier onlySigner() {
        if (!_signers[msg.sender]) {
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
