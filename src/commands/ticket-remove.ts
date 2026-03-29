import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionFlagsBits, PermissionsBitField, TextChannel } from 'discord.js';
import { getDb } from '../lib/database';

export class TicketRemoveCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.TICKET_REMOVE.NAME,
            description: COMMANDS.TICKET_REMOVE.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addUserOption(option => 
                    option.setName(COMMANDS.TICKET_REMOVE.OPT_USER)
                        .setDescription(COMMANDS.TICKET_REMOVE.OPT_USER_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        );
    }

    private async isInTicket(channelId: string): Promise<boolean> {
        const db = await getDb();
        const session = await db.get("SELECT channelId FROM ActiveTickets WHERE channelId = ?", [channelId]);
        return !!session;
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.channel || !(await this.isInTicket(interaction.channelId))) {
            return interaction.reply({ content: MESSAGES.TICKET_NOT_IN_TICKET, flags: MessageFlags.Ephemeral });
        }

        const user = interaction.options.getUser(COMMANDS.TICKET_REMOVE.OPT_USER, true);
        const channel = interaction.channel as TextChannel;

        await channel.permissionOverwrites.edit(user.id, {
            ViewChannel: false,
            SendMessages: false,
            ReadMessageHistory: false
        });

        return interaction.reply({ content: MESSAGES.TICKET_USER_REMOVED(`<@${user.id}>`) });
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        if (!message.channel || !(await this.isInTicket(message.channel.id))) {
            await (message.channel as any).send({ content: MESSAGES.TICKET_NOT_IN_TICKET }).then((m: Message) => setTimeout(() => m.delete().catch(() => null), 5000));
            return;
        }

        const user = await args.pick('member').catch(() => null);
        if (!user) {
            await (message.channel as any).send({ content: "Por favor, menciona a un usuario o proporciona su ID." }).then((m: Message) => setTimeout(() => m.delete().catch(() => null), 5000));
            return;
        }

        const channel = message.channel as TextChannel;
        await channel.permissionOverwrites.edit(user.id, {
            ViewChannel: false,
            SendMessages: false,
            ReadMessageHistory: false
        });

        await (message.channel as any).send({ content: MESSAGES.TICKET_USER_REMOVED(`<@${user.id}>`) });
    }
}
