export function describeDeadline(deadline: bigint): string {
    return deadline >= 0n ? ` valid for ${deadline} seconds` : ` expired ${-deadline} seconds ago`;
}
