import { Account } from '@frugal-wizard/contract-test-helper';

export function describeSignatures(signers: Account[]): string {
    return ` signed by ${signers.join(', ') || 'none'}`;
}
