import { getBlockTimestamp } from '@frugal-wizard/abi2ts-lib';
import { setChainTime } from '@frugal-wizard/contract-test-helper';
import { TreasuryAction } from './Treasury';

export function createWaitExecutionDelayAction(): TreasuryAction {
    return {
        description: `wait execution delay`,

        async execute(ctx) {
            await setChainTime(await getBlockTimestamp() + Number(ctx.executionDelay));
        },
    };
}
