import { Account } from '@frugalwizard/contract-test-helper';

export function describeSignatures(signers: Account[]): string {
    return ` signed by ${signers.join(', ') || 'none'}`;
}
