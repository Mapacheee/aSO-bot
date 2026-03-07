import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class MuteCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.MUTE.NAME, description: COMMANDS.MUTE.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option.setName(COMMANDS.MUTE.OPT_USER).setDescription(COMMANDS.MUTE.OPT_USER_DESC).setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ModerateMembers')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser(COMMANDS.MUTE.OPT_USER, true);
        
        await interaction.showModal({
            title: MESSAGES.MUTE_MODAL_TITLE,
            custom_id: `modal_mute_${user.id}`,
            components: [
                {
                    type: 1, 
                    components: [
                        {
                            type: 4, 
                            custom_id: 'mute_duration',
                            label: MESSAGES.MUTE_DURATION_LABEL,
                            style: 1, 
                            required: true
                        }
                    ]
                }
            ]
        });
    }
}
