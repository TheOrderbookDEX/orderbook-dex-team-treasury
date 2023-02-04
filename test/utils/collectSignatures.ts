import { Address, getProvider, signTypedData } from '@frugal-wizard/abi2ts-lib';

export async function collectSignatures({
    signers,
    domainName,
    domainVersion,
    verifyingContract,
    types,
    data,
}: {
    signers: Address[];
    domainName: string;
    domainVersion: string;
    verifyingContract: string;
    types: Parameters<typeof signTypedData>[2];
    data: Parameters<typeof signTypedData>[3];
}): Promise<string[]> {
    const provider = getProvider();
    const chainId = await provider.getSigner().getChainId();
    const signatures: string[] = [];
    for (const signer of signers) {
        signatures.push(await signTypedData(signer, {
            name: domainName,
            version: domainVersion,
            chainId,
            verifyingContract,
        }, types, data));
    }
    return signatures;
}
