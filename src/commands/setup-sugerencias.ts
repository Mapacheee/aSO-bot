import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, PermissionFlagsBits, PermissionsBitField } from 'discord.js';

export class SetupSugerenciasCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SETUP_SUGERENCIAS.NAME,
            description: COMMANDS.SETUP_SUGERENCIAS.DESCRIPTION,
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

    private getSugPanel() {
        const embed = new EmbedBuilder()
            .setColor('#fadd4b')
            .setDescription(`${MESSAGES.SUG_SETUP_TITLE}\n${MESSAGES.SUG_SETUP_DESC}`);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_sug_create')
                    .setLabel(MESSAGES.SUG_BTN_CREATE)
                    .setStyle(ButtonStyle.Primary)
            );

        return { embeds: [embed], components: [row] };
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.reply(this.getSugPanel());
    }

    public async messageRun(message: Message) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        await (message.channel as any).send(this.getSugPanel());
        await message.delete().catch(() => null);
    }
}
