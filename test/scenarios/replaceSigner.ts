import { MAX_UINT256 } from '@frugalwizard/abi2ts-lib';
import { Account, Addresses, generatorChain } from '@frugalwizard/contract-test-helper';
import { AfterDeadline, CannotSelfSign, DuplicateSignature, InvalidSignature, InvalidSigner, NotEnoughSignatures, SignaturesOutOfOrder, Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
import { createReplaceSignerScenario } from '../scenario/replaceSigner';

export const replaceSignerScenarios = [
    createReplaceSignerScenario({
        signerToRemove: Account.SECOND,
        signerToAdd: Account.THIRD,
        signatures: [ Account.SECOND ],
    }),

    createReplaceSignerScenario({
        signerToRemove: Account.MAIN,
        signerToAdd: Account.THIRD,
        signatures: [ Account.SECOND ],
    }),

    ...generatorChain(function*() {
        yield {
            signerToRemove: Account.SECOND,
            signerToAdd: Account.THIRD,
            signatures: [ Account.SECOND ],
        };

    }).then(function*(props) {
        yield {
            ...props,
            description: 'replace signer using unathorized account',
            caller: Account.THIRD,
            expectedError: new Unauthorized(),
        };

        yield {
            ...props,
            description: 'replace signer using unathorized account signature',
            signatures: [ Account.THIRD ],
            expectedError: new InvalidSignature(),
        };

        yield {
            ...props,
            description: 'replace signer not providing enough signatures',
            signatures: [],
            expectedError: new NotEnoughSignatures(),
        };

        yield {
            ...props,
            description: 'replace signer using self signed signature',
            signatures: [ Account.MAIN ],
            expectedError: new CannotSelfSign(),
        };

        yield {
            ...props,
            description: 'replace signer using duplicate signature',
            signerToAdd: Account.FOURTH,
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.SECOND ],
            expectedError: new DuplicateSignature(),
        };

        yield {
            ...props,
            description: 'replace signer using signatures out of order',
            signerToAdd: Account.FOURTH,
            signers: [ Account.MAIN, Account.SECOND, Account.THIRD ],
            signaturesRequired: 2n,
            signatures: [ Account.SECOND, Account.THIRD ],
            reverseSignatures: true,
            expectedError: new SignaturesOutOfOrder(),
        };

        yield {
            ...props,
            description: 'replace signer using wrong nonce',
            nonce: MAX_UINT256,
            expectedError: new InvalidSignature(),
        };

        yield {
            ...props,
            description: 'replace signer after deadline',
            deadline: -60n,
            expectedError: new AfterDeadline(),
        };

    }).then(function*(props) {
        yield createReplaceSignerScenario(props);
    }),

    createReplaceSignerScenario({
        description: 'replace signer with invalid signer',
        signerToRemove: Account.SECOND,
        signerToAdd: Addresses.ZERO,
        signatures: [ Account.SECOND ],
        expectedError: new InvalidSigner(),
    }),
];
