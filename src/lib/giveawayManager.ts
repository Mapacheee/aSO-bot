import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { getDb } from './database';
import { MESSAGES } from '../constants/messages';

export const startGiveawayTimer = (client: Client, messageId: string, endTime: number) => {
    const delay = (endTime * 1000) - Date.now();
    
    if (delay <= 0) {
        endGiveaway(client, messageId);
    } else {
        setTimeout(() => endGiveaway(client, messageId), delay);
    }
};

export const initGiveawayTimers = async (client: Client) => {
    try {
        const db = await getDb();
        const activeGiveaways = await db.all(
            "SELECT messageId, endTime FROM Giveaways WHERE status = 'active'"
        );

        for (const giveaway of activeGiveaways) {
            startGiveawayTimer(client, giveaway.messageId, giveaway.endTime);
        }
    } catch (error) {
        console.error('Init Giveaway Timers Error:', error);
    }
};

export const endGiveaway = async (client: Client, messageId: string) => {
    try {
        const db = await getDb();
        const giveaway = await db.get(
            "SELECT messageId, channelId, prize, winnersCount, endTime, status FROM Giveaways WHERE messageId = ?", 
            [messageId]
        );

        if (!giveaway || giveaway.status !== 'active') return;

        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel || !(channel instanceof TextChannel)) {
            await db.run("UPDATE Giveaways SET status = 'ended' WHERE messageId = ?", [messageId]);
            return;
        }

        const message = await channel.messages.fetch(messageId).catch(() => null);
        const participants = await db.all(
            "SELECT userId FROM GiveawayParticipants WHERE messageId = ?",
            [messageId]
        );

        if (!participants || participants.length === 0) {
            if (message) {
                const title = MESSAGES.GIVEAWAY_ENDED_TITLE(giveaway.prize);
                const body = MESSAGES.GIVEAWAY_ENDED_TEXT(giveaway.prize, MESSAGES.GIVEAWAY_NO_PARTICIPANTS);
                await message.edit({ content: `${title}\n${body}`, components: [] });
            }
            await db.run("UPDATE Giveaways SET status = 'ended' WHERE messageId = ?", [messageId]);
            return;
        }

        const winners = [];
        const winnersCount = Math.min(giveaway.winnersCount, participants.length);
        const pool = [...participants];

        for (let i = 0; i < winnersCount; i++) {
            const index = Math.floor(Math.random() * pool.length);
            winners.push(`<@${pool[index].userId}>`);
            pool.splice(index, 1);
        }

        const winnersText = winners.join(', ');

        if (message) {
            const title = MESSAGES.GIVEAWAY_ENDED_TITLE(giveaway.prize);
            const body = MESSAGES.GIVEAWAY_ENDED_TEXT(giveaway.prize, winnersText);
            await message.edit({ content: `${title}\n${body}`, components: [] });
        }

        await db.run("UPDATE Giveaways SET status = 'ended' WHERE messageId = ?", [messageId]);
    } catch (error) {
        console.error('End Giveaway Error:', error);
    }
};
