import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const initDb = async () => {
    if (db) return db;

    const dbPath = path.join(process.cwd(), 'database.sqlite');
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS ServerStatus (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            channelId TEXT NOT NULL,
            messageId TEXT NOT NULL
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS TempVoiceChannels (
            channelId TEXT PRIMARY KEY
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS Giveaways (
            messageId TEXT PRIMARY KEY,
            channelId TEXT NOT NULL,
            prize TEXT NOT NULL,
            winnersCount INTEGER NOT NULL,
            endTime INTEGER NOT NULL,
            status TEXT DEFAULT 'active'
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS GiveawayParticipants (
            messageId TEXT NOT NULL,
            userId TEXT NOT NULL,
            PRIMARY KEY (messageId, userId)
        )
    `);

    return db;
};

export const getDb = async () => {
    if (!db) return await initDb();
    return db;
};
