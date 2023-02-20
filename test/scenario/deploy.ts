import { Address, ContractError } from '@frugalwizard/abi2ts-lib';
import { Account, Addresses, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';
import { compareHexString } from '../utils/compareHexString';
import { describeTreasuryProps } from './Treasury';

type Signer = Account | Addresses.ZERO;

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
    reverseSigners = false,
    expectedError,
}: {
    only?: boolean;
    description?: string;
    signers?: Signer[];
    signaturesRequired?: bigint;
    executionDelay?: bigint;
    reverseSigners?: boolean;
    expectedError?: ContractError;
}): DeployScenario {
    return {
        expectedError,

        ...createEthereumScenario({
            only,
            description: description || `deploy${describeTreasuryProps({ signers, signaturesRequired, executionDelay })}`,

            async setup(ctx) {
                ctx.addContext('signers', signers);
                ctx.addContext('signaturesRequired', signaturesRequired);
                ctx.addContext('executionDelay', executionDelay);

                const signersAddresses = signers.map(signer => ctx[signer]).sort(compareHexString);
                if (reverseSigners) signersAddresses.reverse();

                return {
                    ...ctx,
                    signers: signersAddresses,
                    signaturesRequired,
                    executionDelay,
                    execute: () => OrderbookDEXTeamTreasury.deploy(signersAddresses, signaturesRequired, executionDelay),
                    executeStatic: () => OrderbookDEXTeamTreasury.callStatic.deploy(signersAddresses, signaturesRequired, executionDelay),
                };
            },
        })
    };
}
