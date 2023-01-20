import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { NotEnoughSigners } from '../../src/OrderbookDEXTeamTreasury';
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
        signers: [],
        signaturesRequired: 0n,
        expectedError: new NotEnoughSigners(),
    }),
    createDeployScenario({
        signers: [ Account.MAIN ],
        signaturesRequired: 1n,
        expectedError: new NotEnoughSigners(),
    }),
];
