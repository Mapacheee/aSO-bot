import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class ImagenEmbedCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.IMAGEN_EMBED.NAME, description: COMMANDS.IMAGEN_EMBED.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addAttachmentOption(option => 
                    option.setName(COMMANDS.IMAGEN_EMBED.OPT_IMG)
                        .setDescription(COMMANDS.IMAGEN_EMBED.OPT_IMG_DESC)
                        .setRequired(true)
                )
        , { idHints: ['1479657787490308110'] });
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const attachment = interaction.options.getAttachment(COMMANDS.IMAGEN_EMBED.OPT_IMG, true);
        
        if (interaction.channel && interaction.channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setImage(attachment.url)
                .setColor('#2b2d31');

            await (interaction.channel as any).send({ embeds: [embed] });
            return interaction.reply({ content: 'Imagen enviada correctamente.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
    }
}
