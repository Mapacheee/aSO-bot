import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, PermissionFlagsBits, PermissionsBitField } from 'discord.js';

export class SetupNotificacionesCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_NOTIFICACIONES.NAME,
            description: COMMANDS.SETUP_NOTIFICACIONES.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${MESSAGES.NOTIF_SETUP_TITLE}\n${MESSAGES.NOTIF_SETUP_DESC}`);

        const row1 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_notif_add')
                    .setLabel(MESSAGES.NOTIF_BTN_ADD)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('btn_notif_remove')
                    .setLabel(MESSAGES.NOTIF_BTN_REMOVE)
                    .setStyle(ButtonStyle.Danger),
            );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_notif_list')
                    .setLabel(MESSAGES.NOTIF_BTN_LIST)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_notif_clear')
                    .setLabel(MESSAGES.NOTIF_BTN_CLEAR)
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2]
        });
    }

    public async messageRun(message: Message) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${MESSAGES.NOTIF_SETUP_TITLE}\n${MESSAGES.NOTIF_SETUP_DESC}`);

        const row1 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_notif_add')
                    .setLabel(MESSAGES.NOTIF_BTN_ADD)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('btn_notif_remove')
                    .setLabel(MESSAGES.NOTIF_BTN_REMOVE)
                    .setStyle(ButtonStyle.Danger),
            );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_notif_list')
                    .setLabel(MESSAGES.NOTIF_BTN_LIST)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_notif_clear')
                    .setLabel(MESSAGES.NOTIF_BTN_CLEAR)
                    .setStyle(ButtonStyle.Secondary)
            );

        await (message.channel as any).send({
            embeds: [embed],
            components: [row1, row2]
        });
        await message.delete().catch(() => null);
    }
}
