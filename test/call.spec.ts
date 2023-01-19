import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import { is } from '@frugal-wizard/contract-test-helper';
import { callScenarios } from './scenarios/call';
import { Called } from '../src/testing/CallableMock';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('call', () => {
    for (const scenario of callScenarios) {
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
                it('should call address with specified call data', async (test) => {
                    const events = (await test.execute()).events.filter(is(Called));
                    expect(events)
                        .to.have.length(1);
                    expect(events[0].address)
                        .to.be.equal(test.target);
                    expect(events[0].data)
                        .to.be.equal(scenario.data);
                });

                it('should increase nonce', async (test) => {
                    const expected = await test.treasury.nonce() + 1n;
                    await test.execute();
                    expect(await test.treasury.nonce())
                        .to.be.equal(expected);
                });
            }
        });
    }
});
