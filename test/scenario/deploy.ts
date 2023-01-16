import { Address } from '@frugal-wizard/abi2ts-lib';
import { Account, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';

export type DeployScenario = EthereumScenario<TestSetupContext & EthereumSetupContext & {
    signers: Address[];
    signaturesRequired: bigint;
    execute(): Promise<OrderbookDEXTeamTreasury>;
}>;

export function createDeployScenario({
    only,
    description,
    signers = [ Account.MAIN, Account.SECOND ],
    signaturesRequired = 1n,
}: {
    only?: boolean;
    description?: string;
    signers?: Account[];
    signaturesRequired?: bigint;
}): DeployScenario {
    return {
        ...createEthereumScenario({
            only,
            description: description || `deploy with signers = ${signers} and signaturesRequired = ${signaturesRequired}`,

            async setup(ctx) {
                ctx.addContext('signers', signers);
                ctx.addContext('signaturesRequired', signaturesRequired);
                return {
                    ...ctx,
                    signers: signers.map(signer => ctx[signer]),
                    signaturesRequired,
                    execute: () => OrderbookDEXTeamTreasury.deploy(signers.map(signer => ctx[signer]), signaturesRequired),
                };
            },
        })
    };
}
