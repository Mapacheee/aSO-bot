import { GameDig } from 'gamedig';
import { Client, EmbedBuilder, AttachmentBuilder, TextChannel } from 'discord.js';
import { getDb } from './database';
import { MESSAGES } from '../constants/messages';
import { IMAGES } from '../constants/images';
import path from 'path';

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

        } catch (error) {
            embed.setColor('#ff0000')
                 .setDescription(MESSAGES.CSGO_STATUS_OFFLINE);
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
