import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionsBitField } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class ImagenCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.IMAGEN.NAME, description: COMMANDS.IMAGEN.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addAttachmentOption(option => 
                    option.setName(COMMANDS.IMAGEN.OPT_IMG)
                        .setDescription(COMMANDS.IMAGEN.OPT_IMG_DESC)
                        .setRequired(true)
                )
        , { idHints: ['1479657788912173286'] });
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const attachment = interaction.options.getAttachment(COMMANDS.IMAGEN.OPT_IMG, true);
        
        if (interaction.channel && interaction.channel.isTextBased()) {
            await (interaction.channel as any).send({ files: [attachment.url] });
            return interaction.reply({ content: 'Imagen enviada correctamente.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
    }

    public async messageRun(message: Message) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const attachment = message.attachments.first();
        if (!attachment) return;

        if (message.channel.isTextBased()) {
            await (message.channel as any).send({ files: [attachment.url] });
            await message.delete().catch(() => null);
        }
    }
}
