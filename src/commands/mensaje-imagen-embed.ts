import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class MensajeImagenEmbedCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.MENSAJE_IMAGEN_EMBED.NAME, description: COMMANDS.MENSAJE_IMAGEN_EMBED.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option => 
                    option.setName(COMMANDS.MENSAJE_IMAGEN_EMBED.OPT_TEXT)
                        .setDescription(COMMANDS.MENSAJE_IMAGEN_EMBED.OPT_TEXT_DESC)
                        .setRequired(true)
                )
                .addAttachmentOption(option => 
                    option.setName(COMMANDS.MENSAJE_IMAGEN_EMBED.OPT_IMG)
                        .setDescription(COMMANDS.MENSAJE_IMAGEN_EMBED.OPT_IMG_DESC)
                        .setRequired(true)
                )
        , { idHints: ['1479657793194688614'] });
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const text = interaction.options.getString(COMMANDS.MENSAJE_IMAGEN_EMBED.OPT_TEXT, true).replace(/\\n/g, '\n');
        const attachment = interaction.options.getAttachment(COMMANDS.MENSAJE_IMAGEN_EMBED.OPT_IMG, true);
        
        if (interaction.channel && interaction.channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setDescription(text)
                .setImage(attachment.url)
                .setColor('#2b2d31');

            await (interaction.channel as any).send({ embeds: [embed] });
            return interaction.reply({ content: 'Mensaje con imagen enviado correctamente.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
    }
}
