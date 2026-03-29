import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionFlagsBits, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { getDb } from '../lib/database';

export class TicketLogsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.TICKET_LOGS.NAME,
            description: COMMANDS.TICKET_LOGS.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption(option => 
                    option.setName(COMMANDS.TICKET_LOGS.OPT_USER)
                        .setDescription(COMMANDS.TICKET_LOGS.OPT_USER_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        );
    }

    private async buildLogsEmbed(userId: string, username: string): Promise<EmbedBuilder> {
        const db = await getDb();
        const tickets = await db.all(
            "SELECT id, category, createdAt, closedAt FROM TicketTranscripts WHERE userId = ? ORDER BY id DESC LIMIT 15",
            [userId]
        );

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(MESSAGES.TICKET_LOGS_TITLE(username));

        if (tickets.length === 0) {
            embed.setDescription(MESSAGES.TICKET_LOGS_EMPTY);
            return embed;
        }

        let desc = 'Últimos tickets cerrados:\n\n';
        for (const t of tickets) {
            desc += `**ID:** #${t.id} | **Cat:** ${t.category} | **Fecha:** ${t.closedAt}\n`;
        }
        
        desc += `\n*Usa \`/${COMMANDS.TICKET_READ.NAME} ${COMMANDS.TICKET_READ.OPT_ID}: <ID>\` para descargar el texto completo.*`;
        embed.setDescription(desc);

        return embed;
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const user = interaction.options.getUser(COMMANDS.TICKET_LOGS.OPT_USER, true);
        const embed = await this.buildLogsEmbed(user.id, user.username);
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        let userId = '';
        let username = 'Usuario';
        
        const mentioned = message.mentions.users.first();
        if (mentioned) {
            userId = mentioned.id;
            username = mentioned.username;
        } else {
            const str = await args.pick('string').catch(() => null);
            if (str && /^\d{17,19}$/.test(str)) {
                userId = str;
                const cached = message.client.users.cache.get(userId);
                if (cached) username = cached.username;
            } else {
                await (message.channel as any).send({ content: "Por favor, menciona a un usuario o proporciona su ID." }).then((m: Message) => setTimeout(() => m.delete().catch(() => null), 5000));
                return;
            }
        }

        const embed = await this.buildLogsEmbed(userId, username);
        await (message.channel as any).send({ embeds: [embed] });
    }
}
