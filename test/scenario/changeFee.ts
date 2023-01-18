import { Address, ContractError, formatValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, EthereumSetupContext, now, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { describeCaller } from '../describe/caller';
import { describeDeadline } from '../describe/deadline';
import { describeSignatures } from '../describe/signatures';
import { describeVersion } from '../describe/version';
import { compareHexString } from '../utils/compareHexString';
import { signTypedData } from '../utils/signTypedData';
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
} & TreasuryProperties): ChangeFeeScenario {
    return {
        version,
        fee,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `change fee for ${describeVersion(version)} to ${formatValue(fee)}${
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
                        ChangeFee: [
                            { name: 'executor', type: 'address' },
                            { name: 'version',  type: 'uint32' },
                            { name: 'fee',      type: 'uint256' },
                            { name: 'nonce',    type: 'uint256' },
                            { name: 'deadline', type: 'uint256' },
                        ],
                    },
                    primaryType: 'ChangeFee',
                    message: {
                        executor: callerAddress,
                        version:  version,
                        fee:      fee,
                        nonce:    actualNonce,
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
