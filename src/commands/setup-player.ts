import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { getDb } from '../lib/database';

export class SetupPlayerCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_PLAYER.NAME,
            description: COMMANDS.SETUP_PLAYER.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addRoleOption(option =>
                    option.setName(COMMANDS.SETUP_PLAYER.OPT_ROLE)
                        .setDescription(COMMANDS.SETUP_PLAYER.OPT_ROLE_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const role = interaction.options.getRole(COMMANDS.SETUP_PLAYER.OPT_ROLE, true);
        
        const db = await getDb();
        await db.run('UPDATE EventsConfig SET roleId = ? WHERE id = 1', [role.id]);

        return interaction.reply({ 
            content: MESSAGES.EVENT_SETUP_ROLE_SUCCESS(role.id), 
            flags: MessageFlags.Ephemeral 
        });
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

        const role = await args.pick('role').catch(() => null);
        
        if (!role) {
            await message.reply(MESSAGES.EVENT_SETUP_MISSING_ARGS);
            return;
        }

        const db = await getDb();
        await db.run('UPDATE EventsConfig SET roleId = ? WHERE id = 1', [role.id]);

        await message.reply(MESSAGES.EVENT_SETUP_ROLE_SUCCESS(role.id));
    }
}
