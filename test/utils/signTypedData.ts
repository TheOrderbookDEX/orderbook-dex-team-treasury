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
    message: unknown;
}): Promise<string[]> {
    const provider = getProvider();
    const chainId = await provider.getSigner().getChainId();
    const signatures: string[] = [];
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
                    chainId,
                    verifyingContract,
                },
                primaryType,
                message: normalizeMessage(message),
            }
        ]);
        signatures.push(signature);
    }
    return signatures;
}

function normalizeMessage(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(normalizeMessage);

    } else if (typeof(value) == 'object' && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,normalizeMessage(v)]));

    } else if (typeof(value) == 'bigint') {
        return String(value);

    } else {
        return value;
    }
}
