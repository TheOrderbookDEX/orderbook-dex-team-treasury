import { Address } from '@frugal-wizard/abi2ts-lib';
import { Account, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';
import { CallableMock } from '../../src/testing/CallableMock';
import { OrderbookMock } from '../../src/testing/OrderbookMock';
import { compareHexString } from '../utils/compareHexString';

export enum Orderbook {
    FIRST   = 'firstOrderbook',
    SECOND  = 'secondOrderbook',
    THIRD   = 'thirdOrderbook',
    ERRORED = 'erroredOrderbook',
}

type Orderbooks = {
    [orderbook in Orderbook]: OrderbookMock;
}

export enum Callable {
    FIRST  = 'firstContract',
    SECOND = 'secondContract',
    THIRD  = 'thirdContract',
}

type Callables = {
    [callable in Callable]: CallableMock;
}

export type TreasuryScenario<Context> = EthereumScenario<Context>;

export type TreasuryContext = {
    readonly treasury: OrderbookDEXTeamTreasury;
    readonly signers: Address[];
    readonly signaturesRequired: bigint;
    readonly executionDelay: bigint;
} & Orderbooks & Callables;

export interface TreasuryProperties {
    signers?: Account[];
    signaturesRequired?: bigint;
    executionDelay?: bigint;
}

export function createTreasuryScenario<Context>({
    only,
    description,
    signers = [ Account.MAIN, Account.SECOND ],
    signaturesRequired = 1n,
    executionDelay = 0n,
    setup,
}: {
    only?: boolean;
    description: string;
    setup(ctx: TestSetupContext & EthereumSetupContext & TreasuryContext): Context | Promise<Context>;
} & TreasuryProperties): TreasuryScenario<Context> {
    return {
        ...createEthereumScenario({
            only,
            description,

            async setup(ctx) {
                ctx.addContext('signers', signers);
                ctx.addContext('signaturesRequired', signaturesRequired);
                ctx.addContext('executionDelay', executionDelay);

                const signersAddresses = signers.map(signer => ctx[signer]).sort(compareHexString);

                const treasury = await OrderbookDEXTeamTreasury.deploy(signersAddresses, signaturesRequired, executionDelay);
                const firstOrderbook   = await OrderbookMock.deploy(false);
                const secondOrderbook  = await OrderbookMock.deploy(false);
                const thirdOrderbook   = await OrderbookMock.deploy(false);
                const erroredOrderbook = await OrderbookMock.deploy(true);
                const firstContract  = await CallableMock.deploy();
                const secondContract = await CallableMock.deploy();
                const thirdContract  = await CallableMock.deploy();
                return setup({
                    ...ctx,
                    treasury,
                    signers: signersAddresses,
                    signaturesRequired,
                    executionDelay,
                    firstOrderbook,
                    secondOrderbook,
                    thirdOrderbook,
                    erroredOrderbook,
                    firstContract,
                    secondContract,
                    thirdContract,
                });
            },
        })
    };
}

export function describeTreasuryProps({
    signers,
    signaturesRequired,
    executionDelay,
}: {
    signers?: string[];
    signaturesRequired?: bigint;
    executionDelay?: bigint;
}): string {
    const description = [];
    if (signers) {
        description.push(`signers = ${signers.toString() || 'none'}`);
    }
    if (signaturesRequired !== undefined) {
        description.push(`signaturesRequired = ${signaturesRequired}`);
    }
    if (executionDelay !== undefined) {
        description.push(`executionDelay = ${executionDelay}`);
    }
    return description.length ? ` with ${description.join(' and ')}` : '';
}
