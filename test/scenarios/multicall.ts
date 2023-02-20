import { MAX_UINT256, parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain } from '@frugalwizard/contract-test-helper';
import { AfterDeadline, CannotSelfSign, DuplicateSignature, InvalidSignature, NotEnoughSignatures, SignaturesOutOfOrder, Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
import { Fail } from '../../src/testing/CallableMock';
import { createSendEthToTreasuryAction } from '../action/sendEthToTreasury';
import { createMulticallScenario } from '../scenario/multicall';
import { Callable } from '../scenario/Treasury';

export const multicallScenarios = [
    ...generatorChain(function*() {
        yield {
            calls: [
                {
                    target: Callable.FIRST,
                    method: 'transfer',
                    argTypes: [ 'address', 'uint256' ],
                    argValues: [ '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', parseValue(1) ],
                },
                {
                    target: Callable.SECOND,
                    method: 'transfer',
                    argTypes: [ 'address', 'uint256' ],
                    argValues: [ '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', parseValue(2) ],
                },
            ],
        };

        yield {
            calls: [
                {
                    target: Callable.SECOND,
                    method: 'transfer',
                    argTypes: [ 'address', 'uint256' ],
                    argValues: [ '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', parseValue(2) ],
                },
                {
                    target: Callable.FIRST,
                    method: 'transfer',
                    argTypes: [ 'address', 'uint256' ],
                    argValues: [ '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', parseValue(1) ],
                },
            ],
        };

    }).then(function*(props) {
        yield {
            ...props,
            signatures: [ Account.SECOND ],
        };

        yield {
            ...props,
            caller: Account.SECOND,
            signatures: [ Account.MAIN ],
        };

        yield {
            ...props,
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.THIRD ],
        };

    }).then(function*(props) {
        yield createMulticallScenario(props);
    }),

    createMulticallScenario({
        calls: [
            {
                target: Callable.FIRST,
                method: 'deposit',
                argTypes: [],
                argValues: [],
                value: parseValue(1),
            },
            {
                target: Callable.SECOND,
                method: 'deposit',
                argTypes: [],
                argValues: [],
                value: parseValue(2),
            },
        ],
        signatures: [ Account.SECOND ],
        setupActions: [
            createSendEthToTreasuryAction({ value: parseValue(3) }),
        ],
    }),

    ...generatorChain(function*() {
        yield {
            description: 'call contract using unathorized account',
            caller: Account.THIRD,
            signatures: [ Account.SECOND ],
            expectedError: new Unauthorized(),
        };

        yield {
            description: 'call contract using unathorized account signature',
            signatures: [ Account.THIRD ],
            expectedError: new InvalidSignature(),
        };

        yield {
            description: 'call contract not providing enough signatures',
            signatures: [],
            expectedError: new NotEnoughSignatures(),
        };

        yield {
            description: 'call contract using self signed signature',
            signatures: [ Account.MAIN ],
            expectedError: new CannotSelfSign(),
        };

        yield {
            description: 'call contract using duplicate signature',
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.SECOND ],
            expectedError: new DuplicateSignature(),
        };

        yield {
            description: 'call contract using signatures out of order',
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.THIRD ],
            reverseSignatures: true,
            expectedError: new SignaturesOutOfOrder(),
        };

        yield {
            description: 'call contract using wrong nonce',
            signatures: [ Account.SECOND ],
            nonce: MAX_UINT256,
            expectedError: new InvalidSignature(),
        };

        yield {
            description: 'call contract after deadline',
            signatures: [ Account.SECOND ],
            deadline: -60n,
            expectedError: new AfterDeadline(),
        };

    }).then(function*(props) {
        yield {
            ...props,
            calls: [
                {
                    target: Callable.FIRST,
                    method: 'transfer',
                    argTypes: [ 'address', 'uint256' ],
                    argValues: [ '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', parseValue(1) ],
                },
            ],
        };

    }).then(function*(props) {
        yield createMulticallScenario(props);
    }),

    createMulticallScenario({
        description: 'call contract that reverts',
        calls: [
            {
                target: Callable.FIRST,
                method: 'fail',
                argTypes: [],
                argValues: [],
            },
        ],
        signatures: [ Account.SECOND ],
        expectedError: new Fail(),
    }),
    createMulticallScenario({
        description: 'call contract succesfully then contract that reverts',
        calls: [
            {
                target: Callable.FIRST,
                method: 'ok',
                argTypes: [],
                argValues: [],
            },
            {
                target: Callable.SECOND,
                method: 'fail',
                argTypes: [],
                argValues: [],
            },
        ],
        signatures: [ Account.SECOND ],
        expectedError: new Fail(),
    }),
];
