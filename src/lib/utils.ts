export function parseDuration(duration: string): number | null {
    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;

    const amount = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's': return amount * 1000;
        case 'm': return amount * 60 * 1000;
        case 'h': return amount * 60 * 60 * 1000;
        case 'd': return amount * 24 * 60 * 60 * 1000;
        default: return null;
    }
}
