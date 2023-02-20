import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import { is } from '@frugalwizard/contract-test-helper';
import { Called } from '../src/testing/CallableMock';
import { multicallScenarios } from './scenarios/multicall';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('multicall', () => {
    for (const scenario of multicallScenarios) {
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
                it('should execute specified calls', async (test) => {
                    const events = (await test.execute()).events.filter(is(Called));
                    expect(events)
                        .to.have.length(test.calls.length);
                    events.forEach((event, i) => {
                        expect(event.address)
                            .to.be.equal(test.calls[i].target);
                        expect(event.data)
                            .to.be.equal(test.calls[i].data);
                        expect(event.value)
                            .to.be.equal(test.calls[i].value);
                    });
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
