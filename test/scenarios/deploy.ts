import { Account } from '@frugal-wizard/contract-test-helper';
import { NotEnoughSigners } from '../../src/OrderbookDEXTeamTreasury';
import { createDeployScenario } from '../scenario/deploy';

export const deployTestScenarios = [
    createDeployScenario({
        signers: [ Account.MAIN, Account.SECOND ],
        signaturesRequired: 1n,
    }),
    createDeployScenario({
        signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
        signaturesRequired: 2n,
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
