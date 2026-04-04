import { Listener } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getMessageLogsChannel } from '../lib/messageLogs';

export class MessageDeleteListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'messageDelete'
        });
    }

    public async run(message: Message) {
        if (!message.guild) return;
        if (message.author?.bot) return;

        const logChannel = await getMessageLogsChannel(message.guild);
        if (!logChannel) return;
        if (logChannel.id === message.channelId) return;

        const content = message.content?.trim() ? message.content : MESSAGES.LOGS_CONTENT_EMPTY;
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle(MESSAGES.LOGS_EMBED_DELETE_TITLE)
            .addFields(
                { name: 'Autor', value: message.author ? `<@${message.author.id}>` : 'Desconocido', inline: true },
                { name: 'Canal', value: `<#${message.channelId}>`, inline: true },
                { name: 'Mensaje', value: content.slice(0, 1024) }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => null);
    }
}
