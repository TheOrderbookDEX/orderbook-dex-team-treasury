import { Address, ContractError, getBlockTimestamp, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, Addresses, describeSetupActions, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { TreasuryAction } from '../action/Treasury';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { compareHexString } from '../utils/compareHexString';
import { collectSignatures } from '../utils/collectSignatures';
import { createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

type Signer = Account | Addresses.ZERO;

export type ReplaceSignerScenario = {
    readonly signerToRemove: Account,
    readonly signerToAdd: Signer,
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
    reverseSignatures = false,
    nonce,
    expectedError,
    setupActions = [],
    ...rest
}: {
    only?: boolean;
    description?: string;
    signerToRemove: Account,
    signerToAdd: Signer,
    deadline?: bigint,
    signatures: Account[],
    caller?: Account;
    reverseSignatures?: boolean;
    nonce?: bigint;
    expectedError?: ContractError;
    setupActions?: TreasuryAction[];
} & TreasuryProperties): ReplaceSignerScenario {
    return {
        signerToRemove,
        signerToAdd,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `replace signer ${signerToRemove} with ${signerToAdd}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${
                describeSetupActions(setupActions)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                await executeSetupActions(setupActions, { ...ctx });
                ctx.addContext('signerToRemove', signerToRemove);
                ctx.addContext('signerToAdd', signerToAdd);
                ctx.addContext('deadline', deadline);
                ctx.addContext('signatures', signatures);
                ctx.addContext('caller', caller);
                ctx.addContext('reverseSignatures', reverseSignatures);
                ctx.addContext('nonce', nonce ?? 'current');
                const signerToRemoveAddress = ctx[signerToRemove];
                const signerToAddAddress = ctx[signerToAdd];
                const actualNonce = nonce ?? await ctx.treasury.nonce();
                const deadlineTimestamp = BigInt(await getBlockTimestamp()) + deadline;
                const callerAddress = ctx[caller];
                const signersAddresses = signatures.map(signer => ctx[signer]).sort(compareHexString);
                if (reverseSignatures) signersAddresses.reverse();
                const actualSignatures = await collectSignatures({
                    signers: signersAddresses,
                    domainName: 'OrderbookDEXTeamTreasury',
                    domainVersion: '1',
                    verifyingContract: ctx.treasury.address,
                    types: {
                        ReplaceSigner: [
                            { name: 'executor',       type: 'address' },
                            { name: 'nonce',          type: 'uint256' },
                            { name: 'signerToRemove', type: 'address' },
                            { name: 'signerToAdd',    type: 'address' },
                            { name: 'deadline',       type: 'uint256' },
                        ],
                    },
                    data: {
                        executor:       callerAddress,
                        nonce:          actualNonce,
                        signerToRemove: signerToRemoveAddress,
                        signerToAdd:    signerToAddAddress,
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
