import { getDb } from './database';
import { MESSAGES } from '../constants/messages';

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const BAR_LENGTH = 10;
const BAR_FILLED = '█';
const BAR_EMPTY = '░';

export const buildPollMessage = (question: string, options: string[], votes: number[], closed: boolean = false) => {
    const total = votes.reduce((a, b) => a + b, 0);
    const title = closed ? MESSAGES.POLL_CLOSED_TITLE(question) : MESSAGES.POLL_TITLE(question);
    const separator = '━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    let body = `\n${separator}`;
    for (let i = 0; i < options.length; i++) {
        const count = votes[i] || 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        const filled = total > 0 ? Math.round((count / total) * BAR_LENGTH) : 0;
        const bar = BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(BAR_LENGTH - filled);
        body += `\n${NUMBER_EMOJIS[i]} **${options[i]}** — \`${bar}\` ${count} (${percent}%)`;
    }
    body += `\n${separator}`;
    body += MESSAGES.POLL_TOTAL_VOTES(total);

    return `${title}\n${body}`;
};

export const getVoteCounts = async (messageId: string, optionCount: number): Promise<number[]> => {
    const db = await getDb();
    const votes = new Array(optionCount).fill(0);

    const rows = await db.all(
        "SELECT optionIndex, COUNT(*) as cnt FROM PollVotes WHERE messageId = ? GROUP BY optionIndex",
        [messageId]
    );

    for (const row of rows) {
        if (row.optionIndex >= 0 && row.optionIndex < optionCount) {
            votes[row.optionIndex] = row.cnt;
        }
    }

    return votes;
};
