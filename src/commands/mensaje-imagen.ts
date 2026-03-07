import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class MensajeImagenCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.MENSAJE_IMAGEN.NAME, description: COMMANDS.MENSAJE_IMAGEN.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option => 
                    option.setName(COMMANDS.MENSAJE_IMAGEN.OPT_TEXT)
                        .setDescription(COMMANDS.MENSAJE_IMAGEN.OPT_TEXT_DESC)
                        .setRequired(true)
                )
                .addAttachmentOption(option => 
                    option.setName(COMMANDS.MENSAJE_IMAGEN.OPT_IMG)
                        .setDescription(COMMANDS.MENSAJE_IMAGEN.OPT_IMG_DESC)
                        .setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const text = interaction.options.getString(COMMANDS.MENSAJE_IMAGEN.OPT_TEXT, true).replace(/\\n/g, '\n');
        const attachment = interaction.options.getAttachment(COMMANDS.MENSAJE_IMAGEN.OPT_IMG, true);
        
        if (interaction.channel && interaction.channel.isTextBased()) {
            await (interaction.channel as any).send({ content: text, files: [attachment.url] });
            return interaction.reply({ content: 'Mensaje con imagen enviado correctamente.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
    }
}
