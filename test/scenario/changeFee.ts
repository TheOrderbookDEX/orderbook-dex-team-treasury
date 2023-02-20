import { Address, ContractError, formatValue, getBlockTimestamp, Transaction } from '@frugalwizard/abi2ts-lib';
import { Account, describeSetupActions, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { TreasuryAction } from '../action/Treasury';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { describeVersion } from '../describe/version';
import { compareHexString } from '../utils/compareHexString';
import { collectSignatures } from '../utils/collectSignatures';
import { createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type ChangeFeeScenario = {
    readonly version: bigint,
    readonly fee: bigint,
    readonly caller: Account,
    readonly expectedError?: ContractError;
} & TreasuryScenario<TestSetupContext & EthereumSetupContext & TreasuryContext & {
    readonly caller: Address,
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}>;

export function createChangeFeeScenario({
    only,
    description,
    version,
    fee,
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
    version: bigint,
    fee: bigint,
    deadline?: bigint,
    signatures: Account[],
    caller?: Account;
    reverseSignatures?: boolean;
    nonce?: bigint;
    expectedError?: ContractError;
    setupActions?: TreasuryAction[];
} & TreasuryProperties): ChangeFeeScenario {
    return {
        version,
        fee,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `change fee for ${describeVersion(version)} to ${formatValue(fee)}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${
                describeSetupActions(setupActions)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                await executeSetupActions(setupActions, { ...ctx });
                ctx.addContext('version', version);
                ctx.addContext('fee', formatValue(fee));
                ctx.addContext('deadline', deadline);
                ctx.addContext('signatures', signatures);
                ctx.addContext('caller', caller);
                ctx.addContext('reverseSignatures', reverseSignatures);
                ctx.addContext('nonce', nonce ?? 'current');
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
                        ChangeFee: [
                            { name: 'executor', type: 'address' },
                            { name: 'nonce',    type: 'uint256' },
                            { name: 'version',  type: 'uint32' },
                            { name: 'fee',      type: 'uint256' },
                            { name: 'deadline', type: 'uint256' },
                        ],
                    },
                    data: {
                        executor: callerAddress,
                        nonce:    actualNonce,
                        version:  version,
                        fee:      fee,
                        deadline: deadlineTimestamp,
                    },
                });
                return {
                    ...ctx,
                    caller: callerAddress,
                    execute: () => ctx.treasury.changeFee(
                        version, fee, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                    executeStatic: () => ctx.treasury.callStatic.changeFee(
                        version, fee, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                };
            },
        }),
    };
}
