import { GameDig } from 'gamedig';
import { Client, EmbedBuilder, AttachmentBuilder, TextChannel } from 'discord.js';
import { getDb } from './database';
import { MESSAGES } from '../constants/messages';
import { IMAGES } from '../constants/images';
import path from 'path';

let lastMap: string | null = null;

export const updateCSGOStatus = async (client: Client) => {
    try {
        const db = await getDb();
        const row = await db.get(`SELECT channelId, messageId FROM ServerStatus WHERE id = 1`);

        if (!row) return;

        const { channelId, messageId } = row;
        const channel = await client.channels.fetch(channelId).catch(() => null);

        if (!channel || !channel.isTextBased()) {
            return;
        }

        const message = await (channel as TextChannel).messages.fetch(messageId).catch(() => null);
        
        if (!message) {
            await db.run(`DELETE FROM ServerStatus WHERE id = 1`);
            return;
        }

        const ip = process.env.CSGO_SERVER_IP;
        const portStr = process.env.CSGO_SERVER_PORT;
        
        if (!ip) return;
        const port = portStr ? parseInt(portStr) : 27015;

        const embed = new EmbedBuilder()
            .setTitle(MESSAGES.CSGO_STATUS_TITLE)
            .setThumbnail(`attachment://${IMAGES.STATUS_LOGO}`)
            .setImage(`attachment://${IMAGES.STATUS_BANNER}`);

        try {
            const state: any = await GameDig.query({
                type: 'csgo',
                host: ip,
                port: port,
                maxRetries: 2
            });

            const connectLink = `steam://connect/${ip}:${port}`;
            const playerCount = state.numplayers ?? state.players.length;

            console.log(`[CSGO Debug] Query success: ${state.name} | Players: ${playerCount}`);

            embed.setColor('#00ff00')
                 .setDescription(MESSAGES.CSGO_STATUS_ONLINE(state.name, state.map, playerCount, state.maxplayers, connectLink));

            const currentMap = state.map?.toLowerCase();
            if (currentMap && lastMap !== null && currentMap !== lastMap) {
                console.log(`[CSGO] Map changed: ${lastMap} -> ${currentMap}`);
                await notifyMapSubscribers(client, currentMap);
            }
            lastMap = currentMap || null;

        } catch (error) {
            embed.setColor('#ff0000')
                 .setDescription(MESSAGES.CSGO_STATUS_OFFLINE);
            lastMap = null;
        }

        const logoPath = path.join(process.cwd(), 'assets', IMAGES.STATUS_LOGO);
        const bannerPath = path.join(process.cwd(), 'assets', IMAGES.STATUS_BANNER);
        const logoAttachment = new AttachmentBuilder(logoPath, { name: IMAGES.STATUS_LOGO });
        const bannerAttachment = new AttachmentBuilder(bannerPath, { name: IMAGES.STATUS_BANNER });

        await message.edit({ embeds: [embed], files: [logoAttachment, bannerAttachment] });

    } catch (error) {
        console.error(`Status Poller Error:`, error);
    }
};

const notifyMapSubscribers = async (client: Client, currentMap: string) => {
    try {
        const db = await getDb();
        const subscribers = await db.all(
            "SELECT userId, mapName, channelId FROM MapSubscriptions WHERE ? LIKE '%' || mapName || '%'",
            [currentMap]
        );

        if (subscribers.length === 0) return;

        console.log(`[CSGO] Notifying ${subscribers.length} subscriber(s) for map: ${currentMap}`);

        const channelGroups: Map<string, { userId: string, mapName: string }[]> = new Map();

        for (const sub of subscribers) {
            const group = channelGroups.get(sub.channelId) || [];
            group.push({ userId: sub.userId, mapName: sub.mapName });
            channelGroups.set(sub.channelId, group);
        }

        for (const [chId, subs] of channelGroups) {
            const channel = await client.channels.fetch(chId).catch(() => null);
            if (channel && channel.isTextBased()) {
                const mentions = subs.map(s => `<@${s.userId}>`).join(' ');
                await (channel as any).send({ content: `${mentions} ${MESSAGES.MAP_NOTIFY(currentMap)}` });
            }
        }

        for (const sub of subscribers) {
            try {
                const user = await client.users.fetch(sub.userId).catch(() => null);
                if (user) {
                    await user.send({ content: MESSAGES.MAP_NOTIFY(currentMap) });
                }
            } catch (err) {
                console.error(`[CSGO] Failed to DM user ${sub.userId}:`, err);
            }
        }
    } catch (error) {
        console.error('[CSGO] Map notification error:', error);
    }
};
