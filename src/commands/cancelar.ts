import { Command, Args } from '@sapphire/framework';
import { Message } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getDb } from '../lib/database';

export class CancelarCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: 'cancelar', description: 'Cancelar notificación de un mapa' });
    }

    public async messageRun(message: Message, args: Args) {
        const mapName = await args.rest('string').catch(() => null);

        if (!mapName) {
            const reply = await message.reply({ content: MESSAGES.MAP_NO_MAP_CANCEL });
            setTimeout(() => reply.delete().catch(() => null), 5000);
            await message.delete().catch(() => null);
            return;
        }

        const map = mapName.toLowerCase().trim();
        const db = await getDb();

        const result = await db.run(
            'DELETE FROM MapSubscriptions WHERE userId = ? AND mapName = ?',
            [message.author.id, map]
        );

        if (result.changes && result.changes > 0) {
            const reply = await message.reply({ content: MESSAGES.MAP_UNSUBSCRIBED(map) });
            setTimeout(() => reply.delete().catch(() => null), 5000);
        } else {
            const reply = await message.reply({ content: MESSAGES.MAP_NOT_SUBSCRIBED(map) });
            setTimeout(() => reply.delete().catch(() => null), 5000);
        }

        await message.delete().catch(() => null);
    }
}
