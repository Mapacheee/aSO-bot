import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class BanCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.BAN.NAME, description: COMMANDS.BAN.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option.setName(COMMANDS.BAN.OPT_USER).setDescription(COMMANDS.BAN.OPT_USER_DESC).setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('BanMembers')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser(COMMANDS.BAN.OPT_USER, true);
        
        await interaction.showModal({
            title: MESSAGES.BAN_MODAL_TITLE,
            custom_id: `modal_ban_${user.id}`,
            components: [
                {
                    type: 1, 
                    components: [
                        {
                            type: 4, 
                            custom_id: 'ban_duration',
                            label: MESSAGES.BAN_DURATION_LABEL,
                            style: 1, 
                            required: true
                        }
                    ]
                }
            ]
        });
    }
}
