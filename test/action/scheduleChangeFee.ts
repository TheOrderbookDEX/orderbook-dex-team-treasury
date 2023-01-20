import { formatValue } from '@frugal-wizard/abi2ts-lib';
import { Account, now } from '@frugal-wizard/contract-test-helper';
import { describeVersion } from '../describe/version';
import { compareHexString } from '../utils/compareHexString';
import { signTypedData } from '../utils/signTypedData';
import { TreasuryAction } from './Treasury';

export function createScheduleChangeFeeAction({
    version,
    fee,
}: {
    version: bigint,
    fee: bigint,
    signatures?: Account[];
    caller?: Account;
}): TreasuryAction {
    return {
        description: `schedule change fee for ${describeVersion(version)} to ${formatValue(fee)}`,

        async execute(ctx) {
            const deadline = now() + 60n;
            const caller = ctx.signers[0];
            const nonce = await ctx.treasury.nonce();
            const signers = ctx.signers.slice(1).sort(compareHexString);
            const actualSignatures = await signTypedData({
                signers,
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
                primaryType: 'ScheduleChangeFee',
                message: {
                    executor: caller,
                    nonce:    nonce,
                    version:  version,
                    fee:      fee,
                    deadline: deadline,
                },
            });
            await ctx.treasury.scheduleChangeFee(version, fee, deadline, actualSignatures, { from: caller });
        },
    };
}
