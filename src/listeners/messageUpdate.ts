import { Listener } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getMessageLogsChannel } from '../lib/messageLogs';

export class MessageUpdateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'messageUpdate'
        });
    }

    public async run(oldMessage: Message, newMessage: Message) {
        if (!newMessage.guild) return;
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        const logChannel = await getMessageLogsChannel(newMessage.guild);
        if (!logChannel) return;
        if (logChannel.id === newMessage.channelId) return;

        const oldContent = oldMessage.content?.trim() ? oldMessage.content : MESSAGES.LOGS_CONTENT_EMPTY;
        const newContent = newMessage.content?.trim() ? newMessage.content : MESSAGES.LOGS_CONTENT_EMPTY;

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(MESSAGES.LOGS_EMBED_EDIT_TITLE)
            .addFields(
                { name: 'Autor', value: `<@${newMessage.author.id}>`, inline: true },
                { name: 'Canal', value: `<#${newMessage.channelId}>`, inline: true },
                { name: 'Antes', value: oldContent.slice(0, 1024) },
                { name: 'Después', value: newContent.slice(0, 1024) }
            )
            .setTimestamp();

        await logChannel.send({ embeds: [embed] }).catch(() => null);
    }
}
