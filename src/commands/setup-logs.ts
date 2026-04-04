import { Command } from '@sapphire/framework';
import { Message, MessageFlags, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { setMessageLogsChannel } from '../lib/messageLogs';

export class SetupLogsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_LOGS.NAME,
            description: COMMANDS.SETUP_LOGS.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.channel || !interaction.channel.isTextBased()) {
            return interaction.reply({ content: MESSAGES.LOGS_SETUP_INVALID_CHANNEL, flags: MessageFlags.Ephemeral });
        }

        await setMessageLogsChannel(interaction.channelId);
        return interaction.reply({ content: MESSAGES.LOGS_SETUP_SUCCESS(interaction.channelId), flags: MessageFlags.Ephemeral });
    }

    public async messageRun(message: Message) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;
        if (!message.inGuild()) return;
        if (!message.channel.isTextBased()) return;
        if (!('send' in message.channel)) return;

        await setMessageLogsChannel(message.channelId);
        await message.channel.send(MESSAGES.LOGS_SETUP_SUCCESS(message.channelId));
        await message.delete().catch(() => null);
    }
}
