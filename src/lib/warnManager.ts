import { getDb } from './database';

export interface CSGOPlayer {
    id: number;
    name: string;
}

export interface PlayerWarnSummary extends CSGOPlayer {
    warns: number;
}

export interface CSGOWarn {
    id: number;
    playerId: number;
    reason: string;
    moderatorId: string;
    createdAt: string;
}

const normalizePlayerName = (name: string) => name.trim().replace(/\s+/g, ' ');

export const getPlayerByName = async (name: string): Promise<CSGOPlayer | null> => {
    const db = await getDb();
    const cleanName = normalizePlayerName(name);
    const player = await db.get<CSGOPlayer>('SELECT id, name FROM CSGOPlayers WHERE LOWER(name) = LOWER(?)', [cleanName]);
    return player ?? null;
};

export const createPlayer = async (name: string): Promise<CSGOPlayer> => {
    const db = await getDb();
    const cleanName = normalizePlayerName(name);
    await db.run('INSERT INTO CSGOPlayers (name) VALUES (?)', [cleanName]);
    const player = await db.get<CSGOPlayer>('SELECT id, name FROM CSGOPlayers WHERE LOWER(name) = LOWER(?)', [cleanName]);
    if (!player) {
        throw new Error('No se pudo crear el jugador');
    }
    return player;
};

export const getOrCreatePlayer = async (name: string): Promise<{ player: CSGOPlayer; created: boolean }> => {
    const existing = await getPlayerByName(name);
    if (existing) {
        return { player: existing, created: false };
    }
    const created = await createPlayer(name);
    return { player: created, created: true };
};

export const getPlayers = async (): Promise<CSGOPlayer[]> => {
    const db = await getDb();
    return db.all<CSGOPlayer[]>('SELECT id, name FROM CSGOPlayers ORDER BY name COLLATE NOCASE ASC');
};

export const getPlayersWithActiveWarns = async (): Promise<PlayerWarnSummary[]> => {
    const db = await getDb();
    return db.all<PlayerWarnSummary[]>(`
        SELECT p.id, p.name, COUNT(w.id) as warns
        FROM CSGOPlayers p
        INNER JOIN CSGOWarns w ON w.playerId = p.id
        WHERE w.active = 1
        GROUP BY p.id, p.name
        ORDER BY warns DESC, p.name COLLATE NOCASE ASC
    `);
};

export const addWarnToPlayer = async (playerId: number, reason: string, moderatorId: string): Promise<void> => {
    const db = await getDb();
    await db.run(
        'INSERT INTO CSGOWarns (playerId, reason, moderatorId) VALUES (?, ?, ?)',
        [playerId, reason.trim(), moderatorId]
    );
};

export const getActiveWarnsByPlayer = async (playerId: number): Promise<CSGOWarn[]> => {
    const db = await getDb();
    return db.all<CSGOWarn[]>(
        'SELECT id, playerId, reason, moderatorId, createdAt FROM CSGOWarns WHERE playerId = ? AND active = 1 ORDER BY id DESC',
        [playerId]
    );
};

export const getActiveWarnById = async (warnId: number): Promise<CSGOWarn | null> => {
    const db = await getDb();
    const warn = await db.get<CSGOWarn>(
        'SELECT id, playerId, reason, moderatorId, createdAt FROM CSGOWarns WHERE id = ? AND active = 1',
        [warnId]
    );
    return warn ?? null;
};

export const removeWarnById = async (warnId: number, moderatorId: string): Promise<boolean> => {
    const db = await getDb();
    const result = await db.run(
        'UPDATE CSGOWarns SET active = 0, removedAt = CURRENT_TIMESTAMP, removedBy = ? WHERE id = ? AND active = 1',
        [moderatorId, warnId]
    );
    return (result.changes ?? 0) > 0;
};
