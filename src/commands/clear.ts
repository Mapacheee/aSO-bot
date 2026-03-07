import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class ClearCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.CLEAR.NAME, description: COMMANDS.CLEAR.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        await interaction.showModal({
            title: MESSAGES.CLEAR_MODAL_TITLE,
            custom_id: 'modal_channel_clear',
            components: [
                {
                    type: 1, 
                    components: [
                        {
                            type: 4, 
                            custom_id: 'clear_amount',
                            label: MESSAGES.CLEAR_AMOUNT_LABEL,
                            style: 1, 
                            required: true
                        }
                    ]
                }
            ]
        });
    }
}
