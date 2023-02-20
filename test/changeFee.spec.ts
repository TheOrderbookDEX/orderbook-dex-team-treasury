import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import { is } from '@frugalwizard/contract-test-helper';
import { FeeChanged } from '../src/OrderbookDEXTeamTreasury';
import { changeFeeScenarios } from './scenarios/changeFee';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('changeFee', () => {
    for (const scenario of changeFeeScenarios) {
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
                it('should change specified fee', async (test) => {
                    await test.execute();
                    expect(await test.treasury.fee(scenario.version))
                        .to.be.equal(scenario.fee);
                });

                it('should increase nonce', async (test) => {
                    const expected = await test.treasury.nonce() + 1n;
                    await test.execute();
                    expect(await test.treasury.nonce())
                        .to.be.equal(expected);
                });

                it('should emit FeeChanged', async (test) => {
                    const events = (await test.execute()).events.filter(is(FeeChanged));
                    expect(events)
                        .to.have.length(1);
                    expect(events[0].address)
                        .to.be.equal(test.treasury.address);
                    expect(events[0].version)
                        .to.be.equal(scenario.version);
                    expect(events[0].fee)
                        .to.be.equal(scenario.fee);
                });
            }
        });
    }
});
