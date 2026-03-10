import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder, PermissionFlagsBits } from 'discord.js';

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
        const modal = new ModalBuilder()
            .setCustomId('giveaway_modal')
            .setTitle(MESSAGES.GIVEAWAY_MODAL_TITLE);

        const durationInput = new TextInputBuilder()
            .setCustomId('giveaway_duration')
            .setLabel(MESSAGES.GIVEAWAY_DURATION_LABEL)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('10m, 1h, 1d')
            .setRequired(true);

        const prizeInput = new TextInputBuilder()
            .setCustomId('giveaway_prize')
            .setLabel(MESSAGES.GIVEAWAY_PRIZE_LABEL)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const winnersInput = new TextInputBuilder()
            .setCustomId('giveaway_winners')
            .setLabel(MESSAGES.GIVEAWAY_WINNERS_LABEL)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(durationInput),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(prizeInput),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(winnersInput)
        );

        await interaction.showModal(modal);
    }
}
