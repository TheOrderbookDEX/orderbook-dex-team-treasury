import { EthereumSetupContext, SetupAction } from '@frugalwizard/contract-test-helper';
import { TreasuryContext } from '../scenario/Treasury';

export type TreasuryAction = SetupAction<TreasuryContext & EthereumSetupContext>;
