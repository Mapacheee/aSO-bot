import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { getDb } from '../lib/database';

export class SetupEventosCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_EVENTOS.NAME,
            description: COMMANDS.SETUP_EVENTOS.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addChannelOption(option =>
                    option.setName(COMMANDS.SETUP_EVENTOS.OPT_CHANNEL)
                        .setDescription(COMMANDS.SETUP_EVENTOS.OPT_CHANNEL_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel(COMMANDS.SETUP_EVENTOS.OPT_CHANNEL, true);
        
        const db = await getDb();
        await db.run('UPDATE EventsConfig SET channelId = ? WHERE id = 1', [channel.id]);

        return interaction.reply({ 
            content: MESSAGES.EVENT_SETUP_CHANNEL_SUCCESS(channel.id), 
            flags: MessageFlags.Ephemeral 
        });
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

        const channel = await args.pick('guildTextChannel').catch(() => null);
        
        if (!channel) {
            await message.reply(MESSAGES.EVENT_SETUP_MISSING_ARGS);
            return;
        }

        const db = await getDb();
        await db.run('UPDATE EventsConfig SET channelId = ? WHERE id = 1', [channel.id]);

        await message.reply(MESSAGES.EVENT_SETUP_CHANNEL_SUCCESS(channel.id));
    }
}
