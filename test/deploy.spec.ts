import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { deployTestScenarios } from './scenarios/deploy';
import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import { SignerAdded } from '../src/OrderbookDEXTeamTreasury';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('deploy', () => {
    for (const scenario of deployTestScenarios) {
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
                it('should deploy with expected amount of signatures required', async (test) => {
                    const treasury = await test.execute();
                    expect(await treasury.signaturesRequired())
                        .to.be.equal(test.signaturesRequired);
                });

                it('should deploy with expected signers', async (test) => {
                    const treasury = await test.execute();
                    for (const signer of test.signers) {
                        expect(await treasury.signers(signer))
                            .to.be.true;
                    }
                });

                it('should emit SignerAdded', async (test) => {
                    const treasury = await test.execute();
                    const { events } = await treasury.getDeployTransaction();
                    expect(events)
                        .to.have.length(test.signers.length);
                    for (const event of events) {
                        expect(event)
                            .to.be.instanceOf(SignerAdded)
                            .that.satisfies((event: SignerAdded) => {
                                expect(event.address)
                                    .to.be.equal(treasury.address);
                                expect(event.signer)
                                    .to.be.oneOf(test.signers);
                                return true;
                            });
                    }
                    expect(events.map(event => (event as SignerAdded).signer))
                        .to.have.members(test.signers);
                });
            }
        });
    }
});
