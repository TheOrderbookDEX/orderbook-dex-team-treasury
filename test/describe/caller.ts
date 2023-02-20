import { Account } from '@frugalwizard/contract-test-helper';

export function describeCaller(caller: Account): string {
    return caller != Account.MAIN ? ` using ${caller}` : '';
}
