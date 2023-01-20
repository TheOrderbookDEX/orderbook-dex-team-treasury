import { increaseTime } from '../utils/increaseTime';
import { TreasuryAction } from './Treasury';

export function createWaitExecutionDelayAction(): TreasuryAction {
    return {
        description: `wait execution delay`,

        async execute(ctx) {
            await increaseTime(ctx.executionDelay);
        },
    };
}
