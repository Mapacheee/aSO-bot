import { Command } from '@sapphire/framework';
import { Message, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class SetupInformacionCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_INFORMACION.NAME,
            description: COMMANDS.SETUP_INFORMACION.DESCRIPTION,
            requiredUserPermissions: ['ManageMessages'],
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

    private async buildPanel(channel: TextChannel) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_info_rules')
                .setLabel(MESSAGES.INFO_BTN_RULES)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('btn_info_vip')
                .setLabel(MESSAGES.INFO_BTN_VIP)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('btn_info_ze')
                .setLabel(MESSAGES.INFO_BTN_ZE)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('btn_info_zm')
                .setLabel(MESSAGES.INFO_BTN_ZM)
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setDescription(`${MESSAGES.INFO_SETUP_TITLE}\n\n${MESSAGES.INFO_SETUP_DESC}`)
            .setColor('#3498db');

        await channel.send({
            embeds: [embed],
            components: [row]
        });
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        
        if (interaction.channel && interaction.channel.isTextBased()) {
            await this.buildPanel(interaction.channel as TextChannel);
            await interaction.editReply({ content: 'Panel de información creado exitosamente.' });
        } else {
            await interaction.editReply({ content: 'Este comando solo puede usarse en un canal de texto.' });
        }
    }

    public async messageRun(message: Message) {
        if (message.channel.isTextBased()) {
            await this.buildPanel(message.channel as TextChannel);
        }
    }
}
