import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits, TextInputStyle } from 'discord.js';

export class SorteoCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SORTEO.NAME,
            description: COMMANDS.SORTEO.DESCRIPTION,
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
            title: MESSAGES.GIVEAWAY_MODAL_TITLE,
            custom_id: 'giveaway_modal',
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: 'giveaway_duration',
                            label: MESSAGES.GIVEAWAY_DURATION_LABEL,
                            style: TextInputStyle.Short,
                            placeholder: '1s, 10m, 1h, 1d',
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: 'giveaway_prize',
                            label: MESSAGES.GIVEAWAY_PRIZE_LABEL,
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
                            custom_id: 'giveaway_winners',
                            label: MESSAGES.GIVEAWAY_WINNERS_LABEL,
                            style: TextInputStyle.Short,
                            placeholder: '1',
                            required: true
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: 'giveaway_acknowledgments',
                            label: MESSAGES.GIVEAWAY_ACKNOWLEDGMENTS_LABEL,
                            style: TextInputStyle.Paragraph,
                            placeholder: 'Ej: Gracias a <@ID> por la donación. (Usa menciones o IDs)',
                            required: false
                        }
                    ]
                }
            ]
        });
    }
}
