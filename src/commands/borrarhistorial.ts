import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class BorrarHistorialCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.BORRARHISTORIAL.NAME, description: COMMANDS.BORRARHISTORIAL.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption((option) =>
                    option.setName(COMMANDS.BORRARHISTORIAL.OPT_USER).setDescription(COMMANDS.BORRARHISTORIAL.OPT_USER_DESC).setRequired(true)
                )
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser(COMMANDS.BORRARHISTORIAL.OPT_USER, true);
        
        await interaction.showModal({
            title: MESSAGES.CLEAR_HISTORY_MODAL_TITLE,
            custom_id: `modal_clear_${user.id}`,
            components: [
                {
                    type: 1, 
                    components: [
                        {
                            type: 4, 
                            custom_id: 'clear_count',
                            label: MESSAGES.CLEAR_HISTORY_COUNT_LABEL,
                            style: 1, 
                            required: true
                        }
                    ]
                },
                {
                    type: 1, 
                    components: [
                        {
                            type: 4, 
                            custom_id: 'clear_time',
                            label: MESSAGES.CLEAR_HISTORY_TIME_LABEL,
                            style: 1, 
                            required: false
                        }
                    ]
                }
            ]
        });
    }
}
