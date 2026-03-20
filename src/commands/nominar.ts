import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits, TextInputStyle } from 'discord.js';

export class NominarCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.NOMINAR.NAME,
            description: COMMANDS.NOMINAR.DESCRIPTION,
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
            title: MESSAGES.NOM_MODAL_TITLE,
            custom_id: 'nom_setup_modal',
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 4,
                            custom_id: 'nom_title',
                            label: MESSAGES.NOM_TITLE_LABEL,
                            style: TextInputStyle.Short,
                            placeholder: 'Evento Sábado',
                            required: true
                        }
                    ]
                }
            ]
        });
    }
}
