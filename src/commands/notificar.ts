import { Command, Args } from '@sapphire/framework';
import { Message } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getDb } from '../lib/database';

export class NotificarCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: 'notificar', description: 'Suscribirse a notificaciones de un mapa' });
    }

    public async messageRun(message: Message, args: Args) {
        const allowedChannel = process.env.MAP_NOTIFY_CHANNEL_ID;
        if (allowedChannel && message.channelId !== allowedChannel) {
            const reply = await message.reply({ content: MESSAGES.MAP_WRONG_CHANNEL(allowedChannel) });
            setTimeout(() => reply.delete().catch(() => null), 5000);
            return;
        }

        const mapName = await args.pick('string').catch(() => null);
        const extra = await args.rest('string').catch(() => null);

        if (!mapName) {
            await message.reply({ content: MESSAGES.MAP_NO_MAP_PROVIDED });
            return;
        }

        if (extra || mapName.includes('<@') || mapName.includes('<#')) {
            await message.reply({ content: MESSAGES.MAP_INVALID_NAME });
            return;
        }

        const map = mapName.toLowerCase().trim();
        const db = await getDb();

        try {
            await db.run(
                'INSERT INTO MapSubscriptions (userId, mapName, channelId) VALUES (?, ?, ?)',
                [message.author.id, map, message.channelId]
            );

            await message.reply({ content: MESSAGES.MAP_SUBSCRIBED(map) });
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                await message.reply({ content: MESSAGES.MAP_ALREADY_SUBSCRIBED(map) });
            }
        }
    }
}
