import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { DefaultOverrides, ZERO_ADDRESS } from '@frugal-wizard/abi2ts-lib';
import { claimFeesScenarios } from './scenarios/claimFees';
import { ClaimFeesCalled } from '../src/testing/OrderbookMock';
import { Orderbook } from './scenario/Treasury';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('claimFees', () => {
    for (const scenario of claimFeesScenarios) {
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
                it('should claim fees from specified orderbooks', async (test) => {
                    const { events } = await test.execute();
                    for (const event of events) {
                        expect(event)
                            .to.be.instanceOf(ClaimFeesCalled)
                            .that.satisfies((event: ClaimFeesCalled) => {
                                expect(event.address)
                                    .to.be.oneOf(test.orderbooks);
                                return true;
                            });
                    }
                    expect(events.map(event => event.address))
                        .to.have.members(
                            scenario.orderbooks
                                .filter(orderbook => orderbook != ZERO_ADDRESS)
                                .filter(orderbook => orderbook != Orderbook.ERRORED)
                                .map(orderbook => test[orderbook as Orderbook].address)
                        );
                });
            }
        });
    }
});
