import { getDb } from './database';

export const tempVoiceTimeouts = new Map<string, NodeJS.Timeout>();

export const addTempChannelToDb = async (channelId: string) => {
    try {
        const db = await getDb();
        await db.run('INSERT OR IGNORE INTO TempVoiceChannels (channelId) VALUES (?)', [channelId]);
    } catch (error) {
        console.error('Failed to add temp channel to DB:', error);
    }
};

export const isTempChannel = async (channelId: string): Promise<boolean> => {
    try {
        const db = await getDb();
        const row = await db.get('SELECT channelId FROM TempVoiceChannels WHERE channelId = ?', [channelId]);
        return !!row;
    } catch (error) {
        console.error('Failed to check if temp channel:', error);
        return false;
    }
};

export const removeTempChannelFromDb = async (channelId: string) => {
    try {
        const db = await getDb();
        await db.run('DELETE FROM TempVoiceChannels WHERE channelId = ?', [channelId]);
    } catch (error) {
        console.error('Failed to remove temp channel from DB:', error);
    }
};

export const getAllTempChannels = async (): Promise<string[]> => {
    try {
        const db = await getDb();
        const rows = await db.all('SELECT channelId FROM TempVoiceChannels');
        return rows.map(r => r.channelId);
    } catch (error) {
        console.error('Failed to get temp channels:', error);
        return [];
    }
};
