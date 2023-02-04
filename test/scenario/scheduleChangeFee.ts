import { Address, ContractError, formatValue, getBlockTimestamp, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { describeVersion } from '../describe/version';
import { compareHexString } from '../utils/compareHexString';
import { collectSignatures } from '../utils/collectSignatures';
import { createTreasuryScenario, describeTreasuryProps, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type ScheduleChangeFeeScenario = {
    readonly version: bigint,
    readonly fee: bigint,
    readonly caller: Account,
    readonly expectedError?: ContractError;
} & TreasuryScenario<TestSetupContext & EthereumSetupContext & TreasuryContext & {
    readonly caller: Address,
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}>;

export function createScheduleChangeFeeScenario({
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
    ...rest
}: {
    only?: boolean;
    description?: string;
    version: bigint;
    fee: bigint;
    deadline?: bigint;
    signatures: Account[];
    caller?: Account;
    reverseSignatures?: boolean;
    nonce?: bigint;
    expectedError?: ContractError;
} & TreasuryProperties): ScheduleChangeFeeScenario {
    return {
        version,
        fee,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `schedule change fee for ${describeVersion(version)} to ${formatValue(fee)}${
                describeDeadline(deadline)}${describeSignatures(signatures)}${describeCaller(caller)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
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
                        ScheduleChangeFee: [
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
                    execute: () => ctx.treasury.scheduleChangeFee(
                        version, fee, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                    executeStatic: () => ctx.treasury.callStatic.scheduleChangeFee(
                        version, fee, deadlineTimestamp, actualSignatures, { from: callerAddress }
                    ),
                };
            },
        }),
    };
}
