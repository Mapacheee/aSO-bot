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
        const files = message.attachments.map((attachment) => `[${attachment.name ?? 'archivo'}](${attachment.url})`).join('\n');
        const image = getImageData(message);
        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle(MESSAGES.LOGS_EMBED_DELETE_TITLE)
            .addFields(
                { name: 'Autor', value: message.author ? `<@${message.author.id}>` : 'Desconocido', inline: true },
                { name: 'Canal', value: `<#${message.channelId}>`, inline: true },
                { name: 'Mensaje', value: content.slice(0, 1024) }
            )
            .setTimestamp();

        if (files) {
            embed.addFields({ name: 'Archivos', value: files.slice(0, 1024) });
        }
        if (image.url && !image.isGif) {
            embed.setImage(image.url);
        }

        await logChannel.send({
            content: image.isGif && image.url ? `GIF: ${image.url}` : undefined,
            embeds: [embed],
            files: image.isGif && image.url ? [image.url] : undefined
        }).catch(() => null);
    }
}
