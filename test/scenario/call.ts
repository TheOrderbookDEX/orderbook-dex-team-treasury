import { Address, ContractError, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, EthereumSetupContext, now, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { compareHexString } from '../utils/compareHexString';
import { encodeCall } from '../utils/encodeCall';
import { signTypedData } from '../utils/signTypedData';
import { Callable, createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type CallScenario = {
    readonly target: Callable,
    readonly data: string,
    readonly caller: Account,
    readonly expectedError?: ContractError;
} & TreasuryScenario<TestSetupContext & EthereumSetupContext & TreasuryContext & {
    readonly target: Address,
    readonly caller: Address,
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}>;

export function createCallScenario({
    only,
    description,
    target,
    method,
    argTypes,
    argValues,
    deadline = 60n,
    signatures,
    caller = Account.MAIN,
    reverseSignatures = false,
    nonce,
    expectedError,
    ...rest
}: {
    only?: boolean;
    description?: string;
    target: Callable;
    method: string;
    argTypes: string[];
    argValues: unknown[];
    deadline?: bigint;
    signatures: Account[];
    caller?: Account;
    reverseSignatures?: boolean;
    nonce?: bigint;
    expectedError?: ContractError;
} & TreasuryProperties): CallScenario {
    const data = encodeCall(method, argTypes, argValues);
    return {
        target,
        data,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `call ${target}.${method}(${argTypes.join(', ')}) with args = ${argValues.map(String).join(', ')}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                ctx.addContext('target', target);
                ctx.addContext('method', method);
                ctx.addContext('argTypes', argTypes);
                ctx.addContext('argValues', argValues.map(String)); // TODO this has to be fixed in contract-test-helper
                ctx.addContext('deadline', deadline);
                ctx.addContext('signatures', signatures);
                ctx.addContext('caller', caller);
                ctx.addContext('reverseSignatures', reverseSignatures);
                ctx.addContext('nonce', nonce ?? 'current');
                const targetAddress = ctx[target].address;
                const deadlineTimestamp = now() + deadline;
                const callerAddress = ctx[caller];
                const actualNonce = nonce ?? await ctx.treasury.nonce();
                const signersAddresses = signatures.map(signer => ctx[signer]).sort(compareHexString);
                if (reverseSignatures) signersAddresses.reverse();
                const actualSignatures = await signTypedData({
                    signers: signersAddresses,
                    domainName: 'OrderbookDEXTeamTreasury',
                    domainVersion: '1',
                    verifyingContract: ctx.treasury.address,
                    types: {
                        Call: [
                            { name: 'executor', type: 'address' },
                            { name: 'target',   type: 'address' },
                            { name: 'data',     type: 'bytes'   },
                            { name: 'nonce',    type: 'uint256' },
                            { name: 'deadline', type: 'uint256' },
                        ],
                    },
                    primaryType: 'Call',
                    message: {
                        executor: callerAddress,
                        target:   targetAddress,
                        data:     data,
                        nonce:    actualNonce,
                        deadline: deadlineTimestamp,
                    },
                });
                return {
                    ...ctx,
                    target: targetAddress,
                    caller: callerAddress,
                    execute: () => ctx.treasury.call(
                        targetAddress, data, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                    executeStatic: () => ctx.treasury.callStatic.call(
                        targetAddress, data, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                };
            },
        }),
    };
}
