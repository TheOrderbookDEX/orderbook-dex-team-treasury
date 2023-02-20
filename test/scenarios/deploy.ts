import { Account, Addresses, generatorChain } from '@frugalwizard/contract-test-helper';
import { DuplicateSigner, InvalidSigner, NotEnoughSigners, SignersOutOfOrder } from '../../src/OrderbookDEXTeamTreasury';
import { createDeployScenario } from '../scenario/deploy';

export const deployTestScenarios = [
    ...generatorChain(function*() {
        for (const signersAmount of [ 2, 3 ]) {
            const signers = [ Account.MAIN, Account.SECOND, Account.THIRD ].slice(0, signersAmount);

            yield {
                signers,
            };
        }

    }).then(function*(props) {
        for (const signaturesRequired of [ 1n, 2n ]) {
            if (props.signers.length <= signaturesRequired) continue;

            yield {
                ...props,
                signaturesRequired,
            };
        }

    }).then(function*(props) {
        for (const executionDelay of [ 0n, 60n ]) {
            yield {
                ...props,
                executionDelay,
            };
        }

    }).then(function*(props) {
        yield createDeployScenario(props);
    }),

    createDeployScenario({
        description: 'deploy with no signers',
        signers: [],
        signaturesRequired: 0n,
        expectedError: new NotEnoughSigners(),
    }),

    createDeployScenario({
        description: 'deploy with not enough signers',
        signers: [ Account.MAIN ],
        signaturesRequired: 1n,
        expectedError: new NotEnoughSigners(),
    }),

    createDeployScenario({
        description: 'deploy with invalid signer',
        signers: [ Addresses.ZERO ],
        signaturesRequired: 0n,
        expectedError: new InvalidSigner(),
    }),

    createDeployScenario({
        description: 'deploy with signers out of order',
        signers: [ Account.MAIN, Account.SECOND ],
        signaturesRequired: 0n,
        reverseSigners: true,
        expectedError: new SignersOutOfOrder(),
    }),

    createDeployScenario({
        description: 'deploy with duplicate signer',
        signers: [ Account.MAIN, Account.MAIN ],
        signaturesRequired: 0n,
        expectedError: new DuplicateSigner(),
    }),
];
