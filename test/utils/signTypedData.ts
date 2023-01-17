import { Address, getProvider } from '@frugal-wizard/abi2ts-lib';

export async function signTypedData({
    signers,
    domainName,
    domainVersion,
    verifyingContract,
    types,
    primaryType,
    message,
}: {
    signers: Address[];
    domainName: string;
    domainVersion: string;
    verifyingContract: string;
    types: Record<string, unknown>;
    primaryType: string;
    message: (signer: string) => unknown;
}): Promise<[Address, string][]> {
    const provider = getProvider();
    const chainId = await provider.getSigner().getChainId();
    const signatures: [Address, string][] = [];
    for (const signer of signers) {
        const signature: string = await provider.send('eth_signTypedData', [
            signer,
            {
                types: {
                    EIP712Domain: [
                        { name: 'name',              type: 'string'  },
                        { name: 'version',           type: 'string'  },
                        { name: 'chainId',           type: 'uint256' },
                        { name: 'verifyingContract', type: 'address' }
                    ],
                    ...types,
                },
                domain: {
                    name: domainName,
                    version: domainVersion,
                    chainId: String(chainId),
                    verifyingContract,
                },
                primaryType,
                message: stringify(message(signer)),
            }
        ]);
        signatures.push([ signer, signature ]);
    }
    return signatures;
}

function stringify(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(stringify);

    } else if (typeof(value) == 'object' && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,stringify(v)]));

    } else {
        return String(value);
    }
}
