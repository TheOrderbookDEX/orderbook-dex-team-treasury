import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account } from '@frugal-wizard/contract-test-helper';
import { createCallScenario } from '../scenario/call';
import { Callable } from '../scenario/Treasury';

export const callScenarios = [
    createCallScenario({
        target: Callable.FIRST,
        method: 'transfer',
        argTypes: [ 'address', 'uint256' ],
        argValues: [ '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', parseValue(1) ],
        signatures: [ Account.SECOND ],
    }),
];
