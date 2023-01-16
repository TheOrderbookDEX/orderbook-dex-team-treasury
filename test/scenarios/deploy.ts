import { Account } from '@frugal-wizard/contract-test-helper';
import { createDeployScenario } from '../scenario/deploy';

export const deployTestScenarios = [
    createDeployScenario({}),
    createDeployScenario({
        signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
        signaturesRequired: 2n,
    }),
];
