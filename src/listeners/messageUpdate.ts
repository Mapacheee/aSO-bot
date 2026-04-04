import { Listener } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { getMessageLogsChannel } from '../lib/messageLogs';

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp)$/i;
const GIF_EXTENSIONS = /\.gif$/i;

const getImageData = (message: Message) => {
    const imageAttachment = message.attachments.find((attachment) => {
        if (attachment.contentType?.startsWith('image/')) return true;
        if (!attachment.name) return false;
        return IMAGE_EXTENSIONS.test(attachment.name);
    });
    if (imageAttachment?.url) {
        const gifByType = imageAttachment.contentType?.toLowerCase() === 'image/gif';
        const gifByName = imageAttachment.name ? GIF_EXTENSIONS.test(imageAttachment.name) : false;
        const gifByUrl = GIF_EXTENSIONS.test(imageAttachment.url);
        return { url: imageAttachment.url, isGif: gifByType || gifByName || gifByUrl };
    }

    const embedImage = message.embeds.find((embed) => embed.image?.url || embed.thumbnail?.url);
    const url = embedImage?.image?.url ?? embedImage?.thumbnail?.url ?? null;
    return { url, isGif: url ? GIF_EXTENSIONS.test(url) : false };
};

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
        const oldImage = getImageData(oldMessage);
        const newImage = getImageData(newMessage);
        if (oldMessage.content === newMessage.content && oldImage.url === newImage.url) return;

        const logChannel = await getMessageLogsChannel(newMessage.guild);
        if (!logChannel) return;
        if (logChannel.id === newMessage.channelId) return;

        const oldContent = oldMessage.content?.trim() ? oldMessage.content : MESSAGES.LOGS_CONTENT_EMPTY;
        const newContent = newMessage.content?.trim() ? newMessage.content : MESSAGES.LOGS_CONTENT_EMPTY;
        const files = newMessage.attachments.map((attachment) => `[${attachment.name ?? 'archivo'}](${attachment.url})`).join('\n');

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

        if (files) {
            embed.addFields({ name: 'Archivos actuales', value: files.slice(0, 1024) });
        }
        if (newImage.url && !newImage.isGif) {
            embed.setImage(newImage.url);
        }

        await logChannel.send({
            content: newImage.isGif && newImage.url ? `GIF: ${newImage.url}` : undefined,
            embeds: [embed],
            files: newImage.isGif && newImage.url ? [newImage.url] : undefined
        }).catch(() => null);
    }
}
