import { Guild, TextChannel } from 'discord.js';
import { getDb } from './database';

export const setMessageLogsChannel = async (channelId: string) => {
    const db = await getDb();
    await db.run(`
        INSERT INTO MessageLogsConfig (id, channelId)
        VALUES (1, ?)
        ON CONFLICT(id) DO UPDATE SET
        channelId = excluded.channelId
    `, [channelId]);
};

export const getMessageLogsChannel = async (guild: Guild): Promise<TextChannel | null> => {
    const db = await getDb();
    const config = await db.get<{ channelId: string }>('SELECT channelId FROM MessageLogsConfig WHERE id = 1');
    if (!config?.channelId) return null;

    const channel = guild.channels.cache.get(config.channelId) ?? await guild.channels.fetch(config.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return null;
    if (!('send' in channel)) return null;
    return channel as TextChannel;
};
