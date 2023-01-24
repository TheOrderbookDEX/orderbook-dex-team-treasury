import { Address, ContractError, formatValue, getBlockTimestamp, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, describeSetupActions, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { TreasuryAction } from '../action/Treasury';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { compareHexString } from '../utils/compareHexString';
import { encodeCall } from '../utils/encodeCall';
import { signTypedData } from '../utils/signTypedData';
import { Callable, createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type MulticallScenario = {
    readonly caller: Account,
    readonly expectedError?: ContractError;
} & TreasuryScenario<TestSetupContext & EthereumSetupContext & TreasuryContext & {
    readonly calls: {
        readonly target: Address;
        readonly data: string,
        readonly value: bigint,
    }[],
    readonly caller: Address,
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}>;

export function createMulticallScenario({
    only,
    description,
    calls,
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
    calls: {
        target: Callable;
        method: string;
        argTypes: string[];
        argValues: unknown[];
        value?: bigint;
    }[];
    deadline?: bigint;
    signatures: Account[];
    caller?: Account;
    reverseSignatures?: boolean;
    nonce?: bigint;
    expectedError?: ContractError;
    setupActions?: TreasuryAction[];
} & TreasuryProperties): MulticallScenario {
    return {
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `${describeCalls(calls)}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${
                describeSetupActions(setupActions)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                await executeSetupActions(setupActions, { ...ctx });

                ctx.addContext('calls', fixForAddContext(calls));
                ctx.addContext('deadline', deadline);
                ctx.addContext('signatures', signatures);
                ctx.addContext('caller', caller);
                ctx.addContext('reverseSignatures', reverseSignatures);
                ctx.addContext('nonce', nonce ?? 'current');

                const actualCalls = calls.map(({ target, method, argTypes, argValues, value }) => ({
                    target: ctx[target].address,
                    data: encodeCall(method, argTypes, argValues),
                    value: value ?? 0n,
                }));

                const actualNonce = nonce ?? await ctx.treasury.nonce();
                const deadlineTimestamp = BigInt(await getBlockTimestamp()) + deadline;
                const callerAddress = ctx[caller];

                const signersAddresses = signatures.map(signer => ctx[signer]).sort(compareHexString);
                if (reverseSignatures) signersAddresses.reverse();

                const actualSignatures = await signTypedData({
                    signers: signersAddresses,
                    domainName: 'OrderbookDEXTeamTreasury',
                    domainVersion: '1',
                    verifyingContract: ctx.treasury.address,
                    types: {
                        Multicall: [
                            { name: 'executor', type: 'address' },
                            { name: 'nonce',    type: 'uint256' },
                            { name: 'calls',    type: 'Call[]' },
                            { name: 'deadline', type: 'uint256' },
                        ],
                        Call: [
                            { name: 'target',   type: 'address' },
                            { name: 'data',     type: 'bytes'   },
                            { name: 'value',    type: 'uint256' },
                        ],
                    },
                    primaryType: 'Multicall',
                    message: {
                        executor: callerAddress,
                        nonce:    actualNonce,
                        calls:    actualCalls,
                        deadline: deadlineTimestamp,
                    },
                });

                return {
                    ...ctx,
                    calls: actualCalls,
                    caller: callerAddress,
                    execute: () => ctx.treasury.multicall(
                        actualCalls.map(({ target, data, value }) => [ target, data, value ]), deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                    executeStatic: () => ctx.treasury.callStatic.multicall(
                        actualCalls.map(({ target, data, value }) => [ target, data, value ]), deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                };
            },
        }),
    };
}

// TODO this should be fixed in contract-test-helper
function fixForAddContext(value: unknown) {
    return JSON.parse(JSON.stringify(value, (_, value) => typeof(value) == 'bigint' ? String(value) : value));
}

function describeCalls(calls: {
    target: Callable;
    method: string;
    argTypes: string[];
    argValues: unknown[];
    value?: bigint;
}[]): string {
    return `call ${calls.length ? calls.map(({ target, method, argTypes, argValues, value }) => {
        const args: string[] = [];
        args.push(`args = [${argValues.map(String).join(', ')}]`);
        if (value) {
            args.push(`value = ${formatValue(value)}`);
        }
        return `${target}.${method}(${argTypes.join(', ')}) with ${args.join(' and ')}`;
    }).join(' then ') : 'nothing'}`;
}
