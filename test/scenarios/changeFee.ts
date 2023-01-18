import { MAX_UINT256, parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { AfterDeadline, CannotSelfSign, DuplicateSignature, InvalidSignature, NotEnoughSignatures, SignaturesOutOfOrder, Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
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
    createChangeFeeScenario({
        description: 'change fee using unathorized account',
        version: 10000n,
        fee: parseValue('0.001'),
        caller: Account.THIRD,
        signatures: [ Account.SECOND ],
        expectedError: new Unauthorized(),
    }),
    createChangeFeeScenario({
        description: 'change fee using unathorized account signature',
        version: 10000n,
        fee: parseValue('0.001'),
        signatures: [ Account.THIRD ],
        expectedError: new InvalidSignature(),
    }),
    createChangeFeeScenario({
        description: 'change fee not providing enough signatures',
        version: 10000n,
        fee: parseValue('0.001'),
        signatures: [],
        expectedError: new NotEnoughSignatures(),
    }),
    createChangeFeeScenario({
        description: 'change fee using self signed signature',
        version: 10000n,
        fee: parseValue('0.001'),
        signatures: [ Account.MAIN ],
        expectedError: new CannotSelfSign(),
    }),
    createChangeFeeScenario({
        description: 'change fee using duplicate signature',
        version: 10000n,
        fee: parseValue('0.001'),
        signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
        signaturesRequired: 2n,
        signatures: [ Account.SECOND, Account.SECOND ],
        expectedError: new DuplicateSignature(),
    }),
    createChangeFeeScenario({
        description: 'change fee using signatures out of order',
        version: 10000n,
        fee: parseValue('0.001'),
        signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
        signaturesRequired: 2n,
        signatures: [ Account.SECOND, Account.THIRD ],
        reverseSignatures: true,
        expectedError: new SignaturesOutOfOrder(),
    }),
    createChangeFeeScenario({
        description: 'change fee using wrong nonce',
        version: 10000n,
        fee: parseValue('0.001'),
        signatures: [ Account.SECOND ],
        nonce: MAX_UINT256,
        expectedError: new InvalidSignature(),
    }),
    createChangeFeeScenario({
        description: 'change fee after deadline',
        version: 10000n,
        fee: parseValue('0.001'),
        signatures: [ Account.SECOND ],
        deadline: -60n,
        expectedError: new AfterDeadline(),
    }),
];
