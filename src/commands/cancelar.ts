import { Command, Args } from '@sapphire/framework';
import { Message } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getDb } from '../lib/database';

export class CancelarCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: 'cancelar', description: 'Cancelar notificación de un mapa' });
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
            await message.reply({ content: MESSAGES.MAP_NO_MAP_CANCEL });
            return;
        }

        if (extra || mapName.includes('<@') || mapName.includes('<#')) {
            await message.reply({ content: MESSAGES.MAP_INVALID_NAME });
            return;
        }

        const map = mapName.toLowerCase().trim();
        const db = await getDb();

        const result = await db.run(
            'DELETE FROM MapSubscriptions WHERE userId = ? AND mapName = ?',
            [message.author.id, map]
        );

        if (result.changes && result.changes > 0) {
            await message.reply({ content: MESSAGES.MAP_UNSUBSCRIBED(map) });
        } else {
            await message.reply({ content: MESSAGES.MAP_NOT_SUBSCRIBED(map) });
        }
    }
}
