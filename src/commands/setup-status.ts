import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder, AttachmentBuilder, TextChannel } from 'discord.js';
import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { IMAGES } from '../constants/images';
import { getDb } from '../lib/database';
import path from 'path';

export class SetupStatusCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.SETUP_STATUS.NAME, description: COMMANDS.SETUP_STATUS.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.channel;
        if (!channel || !channel.isTextBased()) {
            return interaction.reply({ content: 'Este comando solo puede usarse en un canal de texto.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const logoPath = path.join(process.cwd(), 'assets', IMAGES.STATUS_LOGO);
            const bannerPath = path.join(process.cwd(), 'assets', IMAGES.STATUS_BANNER);

            const logoAttachment = new AttachmentBuilder(logoPath, { name: IMAGES.STATUS_LOGO });
            const bannerAttachment = new AttachmentBuilder(bannerPath, { name: IMAGES.STATUS_BANNER });

            const embed = new EmbedBuilder()
                .setTitle(MESSAGES.CSGO_STATUS_TITLE)
                .setDescription("Cargando información del servidor...")
                .setColor('#2b2d31')
                .setThumbnail(`attachment://${IMAGES.STATUS_LOGO}`)
                .setImage(`attachment://${IMAGES.STATUS_BANNER}`);

            const message = await (channel as TextChannel).send({ embeds: [embed], files: [logoAttachment, bannerAttachment] });

            const db = await getDb();
            await db.run(`
                INSERT INTO ServerStatus (id, channelId, messageId) 
                VALUES (1, ?, ?) 
                ON CONFLICT(id) DO UPDATE SET 
                channelId = excluded.channelId, 
                messageId = excluded.messageId
            `, [channel.id, message.id]);

            return interaction.editReply({ content: 'Panel de estado configurado exitosamente. Se actualizará en menos de 1 minuto.' });
        } catch (error) {
            this.container.logger.error(`Error setting up CSGO status: ${error}`);
            return interaction.editReply({ content: MESSAGES.ERROR_GENERIC });
        }
    }
}
