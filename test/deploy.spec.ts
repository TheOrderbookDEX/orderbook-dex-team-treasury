import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { deployTestScenarios } from './scenarios/deploy';

chai.use(chaiAsPromised);

describe('deploy', () => {
    for (const scenario of deployTestScenarios) {
        scenario.describe(({ it }) => {
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
        });
    }
});
