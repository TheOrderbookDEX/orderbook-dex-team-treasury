import { Address, ContractError, encodeCall, formatValue, getBlockTimestamp, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, describeSetupActions, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { TreasuryAction } from '../action/Treasury';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { compareHexString } from '../utils/compareHexString';
import { collectSignatures } from '../utils/collectSignatures';
import { Callable, createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type CallScenario = {
    readonly target: Callable,
    readonly data: string,
    readonly value: bigint,
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
    value = 0n,
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
    target: Callable;
    method: string;
    argTypes: string[];
    argValues: unknown[];
    value?: bigint;
    deadline?: bigint;
    signatures: Account[];
    caller?: Account;
    reverseSignatures?: boolean;
    nonce?: bigint;
    expectedError?: ContractError;
    setupActions?: TreasuryAction[];
} & TreasuryProperties): CallScenario {
    const data = encodeCall(method, argTypes, argValues);
    return {
        target,
        data,
        value,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `${describeCall({ target, method, argTypes, argValues, value })}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${
                describeSetupActions(setupActions)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                await executeSetupActions(setupActions, { ...ctx });
                ctx.addContext('target', target);
                ctx.addContext('method', method);
                ctx.addContext('argTypes', argTypes);
                ctx.addContext('argValues', argValues);
                ctx.addContext('value', value);
                ctx.addContext('deadline', deadline);
                ctx.addContext('signatures', signatures);
                ctx.addContext('caller', caller);
                ctx.addContext('reverseSignatures', reverseSignatures);
                ctx.addContext('nonce', nonce ?? 'current');
                const targetAddress = ctx[target].address;
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
                        Call: [
                            { name: 'executor', type: 'address' },
                            { name: 'nonce',    type: 'uint256' },
                            { name: 'target',   type: 'address' },
                            { name: 'data',     type: 'bytes'   },
                            { name: 'value',    type: 'uint256' },
                            { name: 'deadline', type: 'uint256' },
                        ],
                    },
                    data: {
                        executor: callerAddress,
                        nonce:    actualNonce,
                        target:   targetAddress,
                        data:     data,
                        value:    value,
                        deadline: deadlineTimestamp,
                    },
                });
                return {
                    ...ctx,
                    target: targetAddress,
                    caller: callerAddress,
                    execute: () => ctx.treasury.call(
                        targetAddress, data, value, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                    executeStatic: () => ctx.treasury.callStatic.call(
                        targetAddress, data, value, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                };
            },
        }),
    };
}

function describeCall({
    target,
    method,
    argTypes,
    argValues,
    value,
}: {
    target: Callable;
    method: string;
    argTypes: string[];
    argValues: unknown[];
    value: bigint;
}): string {
    const args: string[] = [];
    args.push(`args = [${argValues.map(String).join(', ')}]`);
    if (value) {
        args.push(`value = ${formatValue(value)}`);
    }
    return `call ${target}.${method}(${argTypes.join(', ')}) with ${args.join(' and ')}`;
}
