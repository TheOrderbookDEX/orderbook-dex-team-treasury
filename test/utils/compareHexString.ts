export function compareHexString(a: string, b: string): number {
    const a_ = BigInt(a);
    const b_ = BigInt(b);
    if (a_ > b_) {
        return 1;
    } else if (a_ < b_) {
        return -1;
    } else {
        return 0;
    }
}
