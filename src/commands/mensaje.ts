import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionsBitField } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class MensajeCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.MENSAJE.NAME, description: COMMANDS.MENSAJE.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option => 
                    option.setName(COMMANDS.MENSAJE.OPT_TEXT)
                        .setDescription(COMMANDS.MENSAJE.OPT_TEXT_DESC)
                        .setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const text = interaction.options.getString(COMMANDS.MENSAJE.OPT_TEXT, true).replace(/\\n/g, '\n');
        
        if (interaction.channel && interaction.channel.isTextBased()) {
            await (interaction.channel as any).send({ content: text });
            return interaction.reply({ content: 'Mensaje enviado correctamente.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const text = await args.rest('string').catch(() => null);
        if (!text) return;

        if (message.channel.isTextBased()) {
            await (message.channel as any).send({ content: text });
            await message.delete().catch(() => null);
        }
    }
}
