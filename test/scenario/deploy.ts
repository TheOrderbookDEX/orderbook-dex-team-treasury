import { Address, ContractError } from '@frugal-wizard/abi2ts-lib';
import { Account, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';
import { describeTreasuryProps } from './Treasury';

export type DeployScenario = {
    readonly expectedError?: ContractError;
} & EthereumScenario<TestSetupContext & EthereumSetupContext & {
    readonly signers: Address[];
    readonly signaturesRequired: bigint;
    readonly executionDelay: bigint;
    execute(): Promise<OrderbookDEXTeamTreasury>;
    executeStatic(): Promise<string>;
}>;

export function createDeployScenario({
    only,
    description,
    signers = [ Account.MAIN, Account.SECOND ],
    signaturesRequired = 1n,
    executionDelay = 0n,
    expectedError,
}: {
    only?: boolean;
    description?: string;
    signers?: Account[];
    signaturesRequired?: bigint;
    executionDelay?: bigint;
    expectedError?: ContractError;
}): DeployScenario {
    return {
        expectedError,

        ...createEthereumScenario({
            only,
            description: description || `deploy${describeTreasuryProps({ signers: signers, signaturesRequired, executionDelay })}`,

            async setup(ctx) {
                ctx.addContext('signers', signers);
                ctx.addContext('signaturesRequired', signaturesRequired);
                ctx.addContext('executionDelay', executionDelay);
                return {
                    ...ctx,
                    signers: signers.map(signer => ctx[signer]),
                    signaturesRequired,
                    executionDelay,
                    execute: () => OrderbookDEXTeamTreasury.deploy(signers.map(signer => ctx[signer]), signaturesRequired, executionDelay),
                    executeStatic: () => OrderbookDEXTeamTreasury.callStatic.deploy(signers.map(signer => ctx[signer]), signaturesRequired, executionDelay),
                };
            },
        })
    };
}
