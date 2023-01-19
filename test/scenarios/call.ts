import { MAX_UINT256, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { AfterDeadline, CannotSelfSign, DuplicateSignature, InvalidSignature, NotEnoughSignatures, SignaturesOutOfOrder, Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
import { createCallScenario } from '../scenario/call';
import { Callable } from '../scenario/Treasury';

export const callScenarios = [
    ...generatorChain(function*() {
        for (const target of [ Callable.FIRST, Callable.SECOND ]) {
            yield { target };
        }

    }).then(function*(props) {
        yield {
            ...props,
            method: 'transfer',
            argTypes: [ 'address', 'uint256' ],
            argValues: [ '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', parseValue(1) ],
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
        yield createCallScenario(props);
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
            target: Callable.FIRST,
            method: 'transfer',
            argTypes: [ 'address', 'uint256' ],
            argValues: [ '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', parseValue(1) ],
        };

    }).then(function*(props) {
        yield createCallScenario(props);
    }),
];
