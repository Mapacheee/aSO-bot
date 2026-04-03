import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, PermissionFlagsBits, PermissionsBitField } from 'discord.js';

export class SetupWarnsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_WARNS.NAME,
            description: COMMANDS.SETUP_WARNS.DESCRIPTION,
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

    private getWarnsPanel() {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(`${MESSAGES.WARNS_SETUP_TITLE}\n${MESSAGES.WARNS_SETUP_DESC}`);

        const row1 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_warns_list')
                    .setLabel(MESSAGES.WARNS_BTN_LIST)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_warns_add')
                    .setLabel(MESSAGES.WARNS_BTN_ADD)
                    .setStyle(ButtonStyle.Success),
            );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_warns_remove')
                    .setLabel(MESSAGES.WARNS_BTN_REMOVE)
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('btn_warns_player')
                    .setLabel(MESSAGES.WARNS_BTN_PLAYER)
                    .setStyle(ButtonStyle.Secondary)
            );

        return { embeds: [embed], components: [row1, row2] };
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.reply(this.getWarnsPanel());
    }

    public async messageRun(message: Message) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        await (message.channel as any).send(this.getWarnsPanel());
        await message.delete().catch(() => null);
    }
}
