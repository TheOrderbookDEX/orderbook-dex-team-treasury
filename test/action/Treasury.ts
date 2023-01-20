import { EthereumSetupContext, SetupAction } from '@frugal-wizard/contract-test-helper';
import { OrderbookDEXTeamTreasury } from '../../src/OrderbookDEXTeamTreasury';

export type TreasuryAction = SetupAction<{
    treasury: OrderbookDEXTeamTreasury;
} & EthereumSetupContext>;
