export function describeVersion(version: bigint): string {
    const patchVersion = version % 100n;
    const minorVersion = (version / 100n) % 100n;
    const majorVersion = version / 10000n;
    return `V${majorVersion}${minorVersion||patchVersion?`.${minorVersion}${patchVersion?`.${patchVersion}`:''}`:''}`;
}
