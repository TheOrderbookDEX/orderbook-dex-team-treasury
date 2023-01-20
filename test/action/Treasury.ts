import { EthereumSetupContext, SetupAction } from '@frugal-wizard/contract-test-helper';
import { TreasuryContext } from '../scenario/Treasury';

export type TreasuryAction = SetupAction<TreasuryContext & EthereumSetupContext>;
