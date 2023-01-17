import { Address, ContractError } from '@frugal-wizard/abi2ts-lib';
import { Account, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';

export type DeployScenario = {
    readonly expectedError?: ContractError;
} & EthereumScenario<TestSetupContext & EthereumSetupContext & {
    readonly signers: Address[];
    readonly signaturesRequired: bigint;
    execute(): Promise<OrderbookDEXTeamTreasury>;
    executeStatic(): Promise<string>;
}>;

export function createDeployScenario({
    only,
    description,
    signers = [ Account.MAIN, Account.SECOND ],
    signaturesRequired = 1n,
    expectedError,
}: {
    only?: boolean;
    description?: string;
    signers?: Account[];
    signaturesRequired?: bigint;
    expectedError?: ContractError;
}): DeployScenario {
    return {
        expectedError,

        ...createEthereumScenario({
            only,
            description: description || `deploy with signers = ${signers.toString() || 'none'} and signaturesRequired = ${signaturesRequired}`,

            async setup(ctx) {
                ctx.addContext('signers', signers);
                ctx.addContext('signaturesRequired', signaturesRequired);
                return {
                    ...ctx,
                    signers: signers.map(signer => ctx[signer]),
                    signaturesRequired,
                    execute: () => OrderbookDEXTeamTreasury.deploy(signers.map(signer => ctx[signer]), signaturesRequired),
                    executeStatic: () => OrderbookDEXTeamTreasury.callStatic.deploy(signers.map(signer => ctx[signer]), signaturesRequired),
                };
            },
        })
    };
}
