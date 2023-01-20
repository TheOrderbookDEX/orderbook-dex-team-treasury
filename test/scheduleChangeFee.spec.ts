import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { DefaultOverrides, getBlockTimestamp } from '@frugal-wizard/abi2ts-lib';
import { is } from '@frugal-wizard/contract-test-helper';
import { FeeChangeScheduled, IOrderbookDEXTeamTreasuryScheduledFee } from '../src/OrderbookDEXTeamTreasury';
import { scheduleChangeFeeScenarios } from './scenarios/scheduleChangeFee';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('scheduleChangeFee', () => {
    for (const scenario of scheduleChangeFeeScenarios) {
        scenario.describe(({ it }) => {
            if (scenario.expectedError) {
                it('should fail', async (test) => {
                    await expect(test.execute())
                        .to.be.rejected;
                });

                it(`should fail with ${scenario.expectedError.name}`, async (test) => {
                    await expect(test.executeStatic())
                        .to.be.rejected.and.eventually.be.deep.equal(scenario.expectedError);
                });

            } else {
                it('should schedule the specified change of fee', async (test) => {
                    await test.execute();
                    const time = BigInt(await getBlockTimestamp()) + await test.treasury.executionDelay();
                    expect(await test.treasury.scheduledFee(scenario.version))
                        .to.be.deep.equal(new IOrderbookDEXTeamTreasuryScheduledFee(scenario.fee, time));
                });

                it('should increase nonce', async (test) => {
                    const expected = await test.treasury.nonce() + 1n;
                    await test.execute();
                    expect(await test.treasury.nonce())
                        .to.be.equal(expected);
                });

                it('should emit FeeChangeScheduled', async (test) => {
                    const events = (await test.execute()).events.filter(is(FeeChangeScheduled));
                    const time = BigInt(await getBlockTimestamp()) + await test.treasury.executionDelay();
                    expect(events)
                        .to.have.length(1);
                    expect(events[0].address)
                        .to.be.equal(test.treasury.address);
                    expect(events[0].version)
                        .to.be.equal(scenario.version);
                    expect(events[0].fee)
                        .to.be.equal(scenario.fee);
                    expect(events[0].time)
                        .to.be.equal(time);
                });
            }
        });
    }
});
