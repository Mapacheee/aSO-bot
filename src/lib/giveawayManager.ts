import { Client, EmbedBuilder } from 'discord.js';
import { getDb } from './database';
import { MESSAGES } from '../constants/messages';

export const startGiveawayTimer = (client: Client, messageId: string, endTime: number) => {
    const delay = (endTime * 1000) - Date.now();
    
    if (delay <= 0) {
        setTimeout(() => endGiveaway(client, messageId), 5000);
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

        console.log(`[Giveaway] Restoring ${activeGiveaways.length} active giveaway(s)`);

        for (const giveaway of activeGiveaways) {
            startGiveawayTimer(client, giveaway.messageId, giveaway.endTime);
        }
    } catch (error) {
        console.error('[Giveaway] Init Timers Error:', error);
    }
};

export const endGiveaway = async (client: Client, messageId: string) => {
    try {
        const db = await getDb();
        const giveaway = await db.get(
            "SELECT messageId, channelId, prize, winnersCount, endTime, status, acknowledgments FROM Giveaways WHERE messageId = ?", 
            [messageId]
        );

        if (!giveaway || giveaway.status !== 'active') return;

        console.log(`[Giveaway] Ending giveaway ${messageId} for prize: ${giveaway.prize}`);

        const channel = await client.channels.fetch(giveaway.channelId).catch((err) => {
            console.error(`[Giveaway] Failed to fetch channel ${giveaway.channelId}:`, err);
            return null;
        });
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
            console.error(`[Giveaway] Channel ${giveaway.channelId} not found or not a text channel, will retry on next restart`);
            return;
        }

        const message = await channel.messages.fetch(messageId).catch((err: any) => {
            console.error(`[Giveaway] Failed to fetch message ${messageId}:`, err);
            return null;
        });

        if (!message) {
            console.error(`[Giveaway] Message ${messageId} not found, will retry on next restart`);
            return;
        }

        const participants = await db.all(
            "SELECT userId FROM GiveawayParticipants WHERE messageId = ?",
            [messageId]
        );

        const embeds = message.embeds.length > 0 ? message.embeds : [];

        if (!participants || participants.length === 0) {
            const title = MESSAGES.GIVEAWAY_ENDED_TITLE(giveaway.prize);
            const body = MESSAGES.GIVEAWAY_ENDED_TEXT(giveaway.prize, MESSAGES.GIVEAWAY_NO_PARTICIPANTS);
            await message.edit({ content: `${title}\n${body}`, embeds, components: [] });
            await db.run("UPDATE Giveaways SET status = 'ended' WHERE messageId = ?", [messageId]);
            console.log(`[Giveaway] Ended ${messageId} with no participants`);
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

        const title = MESSAGES.GIVEAWAY_ENDED_TITLE(giveaway.prize);
        const body = MESSAGES.GIVEAWAY_ENDED_TEXT(giveaway.prize, winnersText);
        await message.edit({ content: `${title}\n${body}`, embeds, components: [] });
        await db.run("UPDATE Giveaways SET status = 'ended' WHERE messageId = ?", [messageId]);
        console.log(`[Giveaway] Ended ${messageId} - Winners: ${winnersText}`);
    } catch (error) {
        console.error('[Giveaway] End Giveaway Error:', error);
    }
};
