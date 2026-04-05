export const eventCache = new Map<string, { imageUrl?: string; userId: string }>();

export function parseEventDateToEpoch(dateStr: string, timeStr: string): number | null {
    try {
        const [dayStr, monthStr, yearStr] = dateStr.split('/');
        const [hourStr, minuteStr] = timeStr.split(':');

        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const year = parseInt(yearStr, 10);
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
            return null;
        }

        const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`;
        const date = new Date(isoString);

        if (isNaN(date.getTime())) return null;

        return Math.floor(date.getTime() / 1000);
    } catch (e) {
        return null;
    }
}
