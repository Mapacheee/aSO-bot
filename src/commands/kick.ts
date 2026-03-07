import { Command } from '@sapphire/framework';
import { MESSAGES } from '../constants/messages';
import { MessageFlags } from 'discord.js';
import { COMMANDS } from '../constants/commands';

export class KickCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.KICK.NAME, description: COMMANDS.KICK.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option.setName(COMMANDS.KICK.OPT_USER).setDescription(COMMANDS.KICK.OPT_USER_DESC).setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('KickMembers')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser(COMMANDS.KICK.OPT_USER, true);
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: MESSAGES.ERROR_USER_NOT_FOUND, flags: MessageFlags.Ephemeral });
        }

        await member.kick('Mod Kick');
        return interaction.reply({ content: MESSAGES.SUCCESS_KICK(user.username), flags: MessageFlags.Ephemeral });
    }
}
