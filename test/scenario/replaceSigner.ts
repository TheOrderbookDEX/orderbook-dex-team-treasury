import { Address, ContractError, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, EthereumSetupContext, now, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { compareHexString } from '../utils/compareHexString';
import { signTypedData } from '../utils/signTypedData';
import { createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type ReplaceSignerScenario = {
    readonly signerToRemove: Account,
    readonly signerToAdd: Account,
    readonly caller: Account,
    readonly expectedError?: ContractError;
} & TreasuryScenario<TestSetupContext & EthereumSetupContext & TreasuryContext & {
    readonly signerToRemove: Address,
    readonly signerToAdd: Address,
    readonly caller: Address,
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}>;

export function createReplaceSignerScenario({
    only,
    description,
    signerToRemove,
    signerToAdd,
    deadline = 60n,
    signatures,
    caller = Account.MAIN,
    expectedError,
    ...rest
}: {
    only?: boolean;
    description?: string;
    signerToRemove: Account,
    signerToAdd: Account,
    deadline?: bigint,
    signatures: Account[],
    caller?: Account;
    expectedError?: ContractError;
} & TreasuryProperties): ReplaceSignerScenario {
    return {
        signerToRemove,
        signerToAdd,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `replace signer ${signerToRemove} with ${signerToAdd}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                ctx.addContext('signerToRemove', signerToRemove);
                ctx.addContext('signerToAdd', signerToAdd);
                ctx.addContext('deadline', deadline);
                ctx.addContext('signatures', signatures);
                ctx.addContext('caller', caller);
                const signerToRemoveAddress = ctx[signerToRemove];
                const signerToAddAddress = ctx[signerToAdd];
                const deadlineTimestamp = now() + deadline;
                const callerAddress = ctx[caller];
                const nonce = await ctx.treasury.nonce();
                const signersAddresses = signatures.map(signer => ctx[signer]).sort(compareHexString);
                const actualSignatures = await signTypedData({
                    signers: signersAddresses,
                    domainName: 'OrderbookDEXTeamTreasury',
                    domainVersion: '1',
                    verifyingContract: ctx.treasury.address,
                    types: {
                        ReplaceSigner: [
                            { name: 'executor',       type: 'address' },
                            { name: 'signerToRemove', type: 'address' },
                            { name: 'signerToAdd',    type: 'address' },
                            { name: 'nonce',          type: 'uint256' },
                            { name: 'deadline',       type: 'uint256' },
                        ],
                    },
                    primaryType: 'ReplaceSigner',
                    message: {
                        executor:       callerAddress,
                        signerToRemove: signerToRemoveAddress,
                        signerToAdd:    signerToAddAddress,
                        nonce:          nonce,
                        deadline:       deadlineTimestamp,
                    },
                });
                return {
                    ...ctx,
                    signerToRemove: signerToRemoveAddress,
                    signerToAdd: signerToAddAddress,
                    caller: callerAddress,
                    execute: () => ctx.treasury.replaceSigner(
                        signerToRemoveAddress, signerToAddAddress, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                    executeStatic: () => ctx.treasury.callStatic.replaceSigner(
                        signerToRemoveAddress, signerToAddAddress, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                };
            },
        }),
    };
}
