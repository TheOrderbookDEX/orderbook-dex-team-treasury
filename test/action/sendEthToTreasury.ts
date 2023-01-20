import { formatValue, getProvider, hexstring } from '@frugal-wizard/abi2ts-lib';
import { TreasuryAction } from './Treasury';

export function createSendEthToTreasuryAction({ value }: {
    value: bigint;
}): TreasuryAction {
    return {
        description: `send ${formatValue(value)} ETH to treasury`,

        async execute(ctx) {
            // TODO abi2ts-lib should provide this
            const signer = getProvider().getSigner(ctx.mainAccount);
            const tx = await signer.sendTransaction({
                to: ctx.treasury.address,
                value: hexstring(value),
            });
            await tx.wait();
        },
    };
}
