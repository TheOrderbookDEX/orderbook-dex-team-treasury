import { formatValue, sendETH } from '@frugal-wizard/abi2ts-lib';
import { TreasuryAction } from './Treasury';

export function createSendEthToTreasuryAction({ value }: {
    value: bigint;
}): TreasuryAction {
    return {
        description: `send ${formatValue(value)} ETH to treasury`,

        async execute(ctx) {
            await sendETH(ctx.mainAccount, ctx.treasury.address, value);
        },
    };
}
