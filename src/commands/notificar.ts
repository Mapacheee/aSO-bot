import { Command, Args } from '@sapphire/framework';
import { Message } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getDb } from '../lib/database';

export class NotificarCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: 'notificar', description: 'Suscribirse a notificaciones de un mapa' });
    }

    public async messageRun(message: Message, args: Args) {
        const mapName = await args.rest('string').catch(() => null);

        if (!mapName) {
            const reply = await message.reply({ content: MESSAGES.MAP_NO_MAP_PROVIDED });
            setTimeout(() => reply.delete().catch(() => null), 5000);
            await message.delete().catch(() => null);
            return;
        }

        const map = mapName.toLowerCase().trim();
        const db = await getDb();

        try {
            await db.run(
                'INSERT INTO MapSubscriptions (userId, mapName, channelId) VALUES (?, ?, ?)',
                [message.author.id, map, message.channelId]
            );

            const reply = await message.reply({ content: MESSAGES.MAP_SUBSCRIBED(map) });
            setTimeout(() => reply.delete().catch(() => null), 5000);
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                const reply = await message.reply({ content: MESSAGES.MAP_ALREADY_SUBSCRIBED(map) });
                setTimeout(() => reply.delete().catch(() => null), 5000);
            }
        }

        await message.delete().catch(() => null);
    }
}
