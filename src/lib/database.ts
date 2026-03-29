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
            status TEXT DEFAULT 'active',
            acknowledgments TEXT
        )
    `);

    try {
        await db.exec('ALTER TABLE Giveaways ADD COLUMN acknowledgments TEXT');
    } catch (e) {}

    await db.exec(`
        CREATE TABLE IF NOT EXISTS GiveawayParticipants (
            messageId TEXT NOT NULL,
            userId TEXT NOT NULL,
            PRIMARY KEY (messageId, userId)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS Polls (
            messageId TEXT PRIMARY KEY,
            channelId TEXT NOT NULL,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            creatorId TEXT NOT NULL,
            status TEXT DEFAULT 'active'
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS PollVotes (
            messageId TEXT NOT NULL,
            userId TEXT NOT NULL,
            optionIndex INTEGER NOT NULL,
            PRIMARY KEY (messageId, userId)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS MapSubscriptions (
            userId TEXT NOT NULL,
            mapName TEXT NOT NULL,
            channelId TEXT NOT NULL,
            PRIMARY KEY (userId, mapName)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS NominationSessions (
            messageId TEXT PRIMARY KEY,
            channelId TEXT NOT NULL,
            title TEXT NOT NULL,
            creatorId TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            adminsOnly INTEGER DEFAULT 0
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS NominationMaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            messageId TEXT NOT NULL,
            mapName TEXT NOT NULL,
            nominatorId TEXT NOT NULL
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS NominationVotes (
            messageId TEXT NOT NULL,
            userId TEXT NOT NULL,
            mapName TEXT NOT NULL,
            PRIMARY KEY (messageId, userId)
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS ActiveTickets (
            channelId TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            category TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS TicketTranscripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            category TEXT NOT NULL,
            transcript TEXT NOT NULL,
            createdAt DATETIME NOT NULL,
            closedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
};

export const getDb = async () => {
    if (!db) return await initDb();
    return db;
};
