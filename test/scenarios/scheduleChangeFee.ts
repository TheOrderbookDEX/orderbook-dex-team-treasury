import { MAX_UINT256, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { AfterDeadline, CannotSelfSign, DuplicateSignature, InvalidFee, InvalidSignature, NotEnoughSignatures, SignaturesOutOfOrder, Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
import { createScheduleChangeFeeScenario } from '../scenario/scheduleChangeFee';

export const scheduleChangeFeeScenarios = [
    ...generatorChain(function*() {
        for (const version of [ 10000n, 20000n ]) {
            yield { version };
        }

    }).then(function*(props) {
        for (const fee of [ parseValue('0.001'), parseValue('0.002') ]) {
            yield { ...props, fee };
        }

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
        for (const executionDelay of [ undefined, 60n ]) {
            yield { ...props, executionDelay };
        }

    }).then(function*(props) {
        yield createScheduleChangeFeeScenario(props);
    }),

    ...generatorChain(function*() {
        yield {
            version: 10000n,
            fee: parseValue('0.001'),
            signatures: [ Account.SECOND ],
        };

    }).then(function*(props) {
        yield {
            ...props,
            description: 'schedule change fee using unathorized account',
            caller: Account.THIRD,
            expectedError: new Unauthorized(),
        };

        yield {
            ...props,
            description: 'schedule change fee using unathorized account signature',
            signatures: [ Account.THIRD ],
            expectedError: new InvalidSignature(),
        };

        yield {
            ...props,
            description: 'schedule change fee not providing enough signatures',
            signatures: [],
            expectedError: new NotEnoughSignatures(),
        };

        yield {
            ...props,
            description: 'schedule change fee using self signed signature',
            signatures: [ Account.MAIN ],
            expectedError: new CannotSelfSign(),
        };

        yield {
            ...props,
            description: 'schedule change fee using duplicate signature',
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.SECOND ],
            expectedError: new DuplicateSignature(),
        };

        yield {
            ...props,
            description: 'schedule change fee using signatures out of order',
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.THIRD ],
            reverseSignatures: true,
            expectedError: new SignaturesOutOfOrder(),
        };

        yield {
            ...props,
            description: 'schedule change fee using wrong nonce',
            nonce: MAX_UINT256,
            expectedError: new InvalidSignature(),
        };

        yield {
            ...props,
            description: 'schedule change fee after deadline',
            deadline: -60n,
            expectedError: new AfterDeadline(),
        };

        yield {
            ...props,
            description: 'schedule change fee using fee larger than max fee',
            fee: parseValue('0.005') + 1n,
            expectedError: new InvalidFee(),
        };

    }).then(function*(props) {
        yield createScheduleChangeFeeScenario(props);
    }),
];
