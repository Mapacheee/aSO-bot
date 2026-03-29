import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, PermissionFlagsBits, PermissionsBitField } from 'discord.js';

export class SetupTicketCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_TICKET.NAME,
            description: COMMANDS.SETUP_TICKET.DESCRIPTION,
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

    private getTicketPanel() {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${MESSAGES.TICKET_SETUP_TITLE}\n${MESSAGES.TICKET_SETUP_DESC}`);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_ticket_compras')
                    .setLabel(MESSAGES.TICKET_BTN_COMPRAS)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_reporte')
                    .setLabel(MESSAGES.TICKET_BTN_REPORTE)
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_sugerencias')
                    .setLabel(MESSAGES.TICKET_BTN_SUGERENCIAS)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_ticket_otros')
                    .setLabel(MESSAGES.TICKET_BTN_OTROS)
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [row] };
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.reply(this.getTicketPanel());
    }

    public async messageRun(message: Message) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        await (message.channel as any).send(this.getTicketPanel());
        await message.delete().catch(() => null);
    }
}
