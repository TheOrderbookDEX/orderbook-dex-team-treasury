import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import { replaceSignerScenarios } from './scenarios/replaceSigner';
import { is } from '@frugalwizard/contract-test-helper';
import { SignerAdded, SignerRemoved } from '../src/OrderbookDEXTeamTreasury';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('replaceSigner', () => {
    for (const scenario of replaceSignerScenarios) {
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
                it('should remove specified signer', async (test) => {
                    await test.execute();
                    expect(await test.treasury.signers(test.signerToRemove))
                        .to.be.false;
                });

                it('should add specified signer', async (test) => {
                    await test.execute();
                    expect(await test.treasury.signers(test.signerToAdd))
                        .to.be.true;
                });

                it('should not change signatures required', async (test) => {
                    const expected = await test.treasury.signaturesRequired();
                    await test.execute();
                    expect(await test.treasury.signaturesRequired())
                        .to.be.equal(expected);
                });

                it('should increase nonce', async (test) => {
                    const expected = await test.treasury.nonce() + 1n;
                    await test.execute();
                    expect(await test.treasury.nonce())
                        .to.be.equal(expected);
                });

                it('should emit SignerAdded', async (test) => {
                    const events = (await test.execute()).events.filter(is(SignerAdded));
                    expect(events)
                        .to.have.length(1);
                    expect(events[0].address)
                        .to.be.equal(test.treasury.address);
                    expect(events[0].signer)
                        .to.be.equal(test.signerToAdd);
                });

                it('should emit SignerRemoved', async (test) => {
                    const events = (await test.execute()).events.filter(is(SignerRemoved));
                    expect(events)
                        .to.have.length(1);
                    expect(events[0].address)
                        .to.be.equal(test.treasury.address);
                    expect(events[0].signer)
                        .to.be.equal(test.signerToRemove);
                });
            }
        });
    }
});
