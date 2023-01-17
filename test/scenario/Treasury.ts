import { Address } from '@frugal-wizard/abi2ts-lib';
import { Account, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';
import { OrderbookMock } from '../../src/testing/OrderbookMock';

export enum Orderbook {
    FIRST   = 'firstOrderbook',
    SECOND  = 'secondOrderbook',
    THIRD   = 'thirdOrderbook',
    ERRORED = 'erroredOrderbook',
}

type Orderbooks = {
    [orderbook in Orderbook]: OrderbookMock;
}

export type TreasuryScenario<Context> = EthereumScenario<Context>;

export type TreasuryContext = {
    readonly treasury: OrderbookDEXTeamTreasury;
    readonly signers: Address[];
    readonly signaturesRequired: bigint;
} & Orderbooks;

export interface TreasuryProperties {
    signers?: Account[];
    signaturesRequired?: bigint;
}

export function createTreasuryScenario<Context>({
    only,
    description,
    signers = [ Account.MAIN, Account.SECOND ],
    signaturesRequired = 1n,
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
                const treasury = await OrderbookDEXTeamTreasury.deploy(signers.map(signer => ctx[signer]), signaturesRequired);
                const firstOrderbook   = await OrderbookMock.deploy(false);
                const secondOrderbook  = await OrderbookMock.deploy(false);
                const thirdOrderbook   = await OrderbookMock.deploy(false);
                const erroredOrderbook = await OrderbookMock.deploy(true);
                return setup({
                    ...ctx,
                    treasury,
                    signers: signers.map(signer => ctx[signer]),
                    signaturesRequired,
                    firstOrderbook,
                    secondOrderbook,
                    thirdOrderbook,
                    erroredOrderbook,
                });
            },
        })
    };
}

export function describeTreasuryProps({
    signers: signers,
    signaturesRequired,
}: TreasuryProperties): string {
    const description = [];
    if (signers) {
        description.push(`signers = ${signers.toString() || 'none'}`);
    }
    if (signaturesRequired !== undefined) {
        description.push(`signaturesRequired = ${signaturesRequired}`);
    }
    return description.length ? ` with ${description.join(' and ')}` : '';
}
