import { Account } from '@frugal-wizard/contract-test-helper';
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
        orderbooks: [],
    }),
    createClaimFeesScenario({
        orderbooks: [],
        caller: Account.THIRD,
        expectedError: new Unauthorized(),
    }),
];
