import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionsBitField, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, TextInputStyle, ModalBuilder, TextInputBuilder, LabelBuilder } from 'discord.js';
import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { eventCache } from '../lib/eventManager';

export class MensajeEventoCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.MENSAJE_EVENTO.NAME,
            description: COMMANDS.MENSAJE_EVENTO.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addAttachmentOption(option =>
                    option.setName(COMMANDS.MENSAJE_EVENTO.OPT_IMAGE)
                        .setDescription(COMMANDS.MENSAJE_EVENTO.OPT_IMAGE_DESC)
                        .setRequired(false)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const attachment = interaction.options.getAttachment(COMMANDS.MENSAJE_EVENTO.OPT_IMAGE);
        const imageUrl = attachment?.url;

        eventCache.set(interaction.id, { imageUrl, userId: interaction.user.id });

        const modal = new ModalBuilder()
            .setCustomId(`event_modal_${interaction.id}`)
            .setTitle(MESSAGES.EVENT_MODAL_TITLE);

        const dateInput = new TextInputBuilder()
            .setCustomId('event_date')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: 14/05/2026')
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('event_time')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: 21:00 (en hora argentina)')
            .setRequired(true);

        const mapInput = new TextInputBuilder()
            .setCustomId('event_map')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ej: ze_mako_reactor_v5')
            .setRequired(true);

        const prizesInput = new TextInputBuilder()
            .setCustomId('event_prizes')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ej: 1er Lugar: VIP Mensual\n2do Lugar: VIP Semanal')
            .setRequired(true);

        const commentsInput = new TextInputBuilder()
            .setCustomId('event_comments')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        modal.addLabelComponents(
            new LabelBuilder().setLabel(MESSAGES.EVENT_MODAL_DATE).setTextInputComponent(dateInput),
            new LabelBuilder().setLabel(MESSAGES.EVENT_MODAL_TIME).setTextInputComponent(timeInput),
            new LabelBuilder().setLabel(MESSAGES.EVENT_MODAL_MAP).setTextInputComponent(mapInput),
            new LabelBuilder().setLabel(MESSAGES.EVENT_MODAL_PRIZES).setTextInputComponent(prizesInput),
            new LabelBuilder().setLabel(MESSAGES.EVENT_MODAL_COMMENTS).setTextInputComponent(commentsInput)
        );

        await interaction.showModal(modal);
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

        const attachment = message.attachments.first();
        const imageUrl = attachment?.url;

        eventCache.set(message.id, { imageUrl, userId: message.author.id });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_event_open_${message.id}`)
                .setLabel(MESSAGES.EVENT_OPEN_BUTTON)
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ content: MESSAGES.EVENT_COMMAND_MESSAGE_REPLY, components: [row] });
        await message.delete().catch(() => null);
    }
}
