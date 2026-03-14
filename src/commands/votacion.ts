import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits, TextInputStyle } from 'discord.js';

export class VotacionCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.VOTACION.NAME,
            description: COMMANDS.VOTACION.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.showModal({
            title: MESSAGES.POLL_MODAL_TITLE,
            custom_id: 'poll_modal',
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: 'poll_question',
                            label: MESSAGES.POLL_QUESTION_LABEL,
                            style: TextInputStyle.Short,
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: 'poll_options',
                            label: MESSAGES.POLL_OPTIONS_LABEL,
                            style: TextInputStyle.Paragraph,
                            placeholder: 'Opción 1\nOpción 2\nOpción 3',
                            required: true
                        }
                    ]
                }
            ]
        });
    }
}
