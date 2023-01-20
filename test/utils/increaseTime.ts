import { getProvider, hexstring } from '@frugal-wizard/abi2ts-lib';

// TODO this should be provided by contract-test-helper

export async function increaseTime(time: bigint): Promise<void> {
    const provider = getProvider();
    await provider.send('evm_increaseTime', [ hexstring(time) ]);
    await provider.send('evm_mine', []);
}
