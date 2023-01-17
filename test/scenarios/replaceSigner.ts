import { Account } from '@frugal-wizard/contract-test-helper';
import { createReplaceSignerScenario } from '../scenario/replaceSigner';

export const replaceSignerScenarios = [
    createReplaceSignerScenario({
        signerToRemove: Account.SECOND,
        signerToAdd: Account.THIRD,
        signatures: [ Account.SECOND ],
    }),
];
