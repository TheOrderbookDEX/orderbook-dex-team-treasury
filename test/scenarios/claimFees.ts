import { Account, Addresses } from '@frugalwizard/contract-test-helper';
import { Unauthorized } from '../../src/OrderbookDEXTeamTreasury';
import { createClaimFeesScenario } from '../scenario/claimFees';
import { Orderbook } from '../scenario/Treasury';

export const claimFeesScenarios = [
    createClaimFeesScenario({
        orderbooks: [ Orderbook.FIRST ],
    }),

    createClaimFeesScenario({
        orderbooks: [ Orderbook.FIRST, Orderbook.SECOND ],
    }),

    createClaimFeesScenario({
        orderbooks: [ Orderbook.FIRST, Orderbook.SECOND, Orderbook.THIRD ],
    }),

    createClaimFeesScenario({
        orderbooks: [ Orderbook.FIRST, Orderbook.ERRORED ],
    }),

    createClaimFeesScenario({
        orderbooks: [ Orderbook.FIRST, Addresses.ZERO ],
    }),

    createClaimFeesScenario({
        orderbooks: [],
    }),

    createClaimFeesScenario({
        description: 'claim fees using unauthorized account',
        orderbooks: [],
        caller: Account.THIRD,
        expectedError: new Unauthorized(),
    }),
];
