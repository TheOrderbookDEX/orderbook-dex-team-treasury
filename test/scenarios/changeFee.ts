import { MAX_UINT256, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { AfterDeadline, CannotChangeFee, CannotSelfSign, DuplicateSignature, InvalidSignature, NotEnoughSignatures, SignaturesOutOfOrder, Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
import { createScheduleChangeFeeAction } from '../action/scheduleChangeFee';
import { createWaitExecutionDelayAction } from '../action/waitExecutionDelay';
import { createChangeFeeScenario } from '../scenario/changeFee';

export const changeFeeScenarios = [
    ...generatorChain(function*() {
        for (const version of [ 10000n, 20000n ]) {
            yield { version };
        }

    }).then(function*(props) {
        for (const fee of [ parseValue('0.001'), parseValue('0.002') ]) {
            yield { ...props, fee };
        }

    }).then(function*(props) {
        for (const executionDelay of [ undefined, 60n ]) {
            yield { ...props, executionDelay };
        }

    }).then(function*(props) {
        const { version, fee } = props;

        yield {
            ...props,
            setupActions: [
                createScheduleChangeFeeAction({ version, fee }),
                createWaitExecutionDelayAction(),
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
        yield createChangeFeeScenario(props);
    }),

    ...generatorChain(function*() {
        const version = 10000n;
        const fee = parseValue('0.001');

        yield {
            version,
            fee,
            signatures: [ Account.SECOND ],
            executionDelay: 60n,
            setupActions: [
                createScheduleChangeFeeAction({ version, fee }),
                createWaitExecutionDelayAction(),
            ],
        };

    }).then(function*(props) {
        const { version, fee } = props;

        yield {
            ...props,
            description: 'change fee using unathorized account',
            caller: Account.THIRD,
            expectedError: new Unauthorized(),
        };

        yield {
            ...props,
            description: 'change fee using unathorized account signature',
            signatures: [ Account.THIRD ],
            expectedError: new InvalidSignature(),
        };

        yield {
            ...props,
            description: 'change fee not providing enough signatures',
            signatures: [],
            expectedError: new NotEnoughSignatures(),
        };

        yield {
            ...props,
            description: 'change fee using self signed signature',
            signatures: [ Account.MAIN ],
            expectedError: new CannotSelfSign(),
        };

        yield {
            ...props,
            description: 'change fee using duplicate signature',
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.SECOND ],
            expectedError: new DuplicateSignature(),
        };

        yield {
            ...props,
            description: 'change fee using signatures out of order',
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.THIRD ],
            reverseSignatures: true,
            expectedError: new SignaturesOutOfOrder(),
        };

        yield {
            ...props,
            description: 'change fee using wrong nonce',
            nonce: MAX_UINT256,
            expectedError: new InvalidSignature(),
        };

        yield {
            ...props,
            description: 'change fee after deadline',
            deadline: -60n,
            expectedError: new AfterDeadline(),
        };

        yield {
            ...props,
            description: 'change fee without scheduling',
            setupActions: [],
            expectedError: new CannotChangeFee(),
        };

        yield {
            ...props,
            description: 'change fee before scheduled time',
            setupActions: [
                createScheduleChangeFeeAction({ version, fee }),
            ],
            expectedError: new CannotChangeFee(),
        };

        yield {
            ...props,
            description: 'change fee above scheduled fee',
            setupActions: [
                createScheduleChangeFeeAction({ version, fee: fee - 1n }),
                createWaitExecutionDelayAction(),
            ],
            expectedError: new CannotChangeFee(),
        };

    }).then(function*(props) {
        yield createChangeFeeScenario(props);
    }),
];
