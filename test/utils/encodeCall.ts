import { abiencode } from '@frugal-wizard/abi2ts-lib';
import { ethers } from 'ethers';

// TODO this should be provided by abi2ts-lib

export function encodeCall(name: string, argTypes: string[], argValues: unknown[]): string {
    const selector = ethers.utils.hexDataSlice(ethers.utils.id(`${name}(${argTypes.join(',')})`), 0, 4);
    const encodedArgs = abiencode(argTypes, argValues);
    return ethers.utils.hexConcat([ selector, encodedArgs ]);
}
