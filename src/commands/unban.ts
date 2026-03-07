import { Command } from '@sapphire/framework';
import { MESSAGES } from '../constants/messages';
import { MessageFlags } from 'discord.js';
import { COMMANDS } from '../constants/commands';

export class UnbanCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.UNBAN.NAME, description: COMMANDS.UNBAN.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption((option) =>
                    option.setName(COMMANDS.UNBAN.OPT_USER).setDescription(COMMANDS.UNBAN.OPT_USER_DESC).setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('BanMembers')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const userId = interaction.options.getString(COMMANDS.UNBAN.OPT_USER, true);
        
        try {
            await interaction.guild?.members.unban(userId);
            return interaction.reply({ content: MESSAGES.SUCCESS_UNBAN(userId), flags: MessageFlags.Ephemeral });
        } catch (error) {
            return interaction.reply({ content: MESSAGES.ERROR_USER_NOT_FOUND, flags: MessageFlags.Ephemeral });
        }
    }
}
