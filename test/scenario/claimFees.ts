import { Address, ContractError, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, Addresses, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { describeCaller } from '../describe/caller';
import { createTreasuryScenario, describeTreasuryProps, Orderbook, TreasuryContext, TreasuryProperties, TreasuryScenario } from './Treasury';

export type ClaimFeesScenario = {
    readonly orderbooks: (Orderbook | Addresses.ZERO)[],
    readonly caller: Account,
    readonly expectedError?: ContractError;
} & TreasuryScenario<TestSetupContext & EthereumSetupContext & TreasuryContext & {
    readonly orderbooks: Address[],
    readonly caller: Address,
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}>;

export function createClaimFeesScenario({
    only,
    description,
    orderbooks,
    caller = Account.MAIN,
    expectedError,
    ...rest
}: {
    only?: boolean;
    description?: string;
    orderbooks: (Orderbook | Addresses.ZERO)[];
    caller?: Account;
    expectedError?: ContractError;
} & TreasuryProperties): ClaimFeesScenario {
    return {
        orderbooks,
        caller,
        expectedError,

        ...createTreasuryScenario({
            only,
            description: description || `claim fees${describeOrderbooks(orderbooks)}${describeCaller(caller)}${describeTreasuryProps(rest)}`,
            ...rest,

            async setup(ctx) {
                ctx.addContext('orderbooks', orderbooks);
                ctx.addContext('caller', caller);
                const orderbooksAddresses = orderbooks.map(orderbook => toAddress(ctx[orderbook]));
                const callerAddress = ctx[caller];
                return {
                    ...ctx,
                    orderbooks: orderbooksAddresses,
                    caller: callerAddress,
                    execute: () => ctx.treasury.claimFees(orderbooksAddresses, { from: callerAddress }),
                    executeStatic: () => ctx.treasury.callStatic.claimFees(orderbooksAddresses, { from: callerAddress }),
                };
            },
        }),
    };
}

function toAddress(addressable: string | { address: string }): string {
    return typeof(addressable) == 'object' ? addressable.address : addressable;
}

function describeOrderbooks(orderbooks: string[]): string {
    return ` from ${orderbooks.join(', ') || 'none'}`;
}
