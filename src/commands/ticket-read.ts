import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command, Args } from '@sapphire/framework';
import { Message, MessageFlags, PermissionFlagsBits, PermissionsBitField, AttachmentBuilder } from 'discord.js';
import { getDb } from '../lib/database';

export class TicketReadCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.TICKET_READ.NAME,
            description: COMMANDS.TICKET_READ.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addIntegerOption(option => 
                    option.setName(COMMANDS.TICKET_READ.OPT_ID)
                        .setDescription(COMMANDS.TICKET_READ.OPT_ID_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        );
    }

    private async fetchTranscript(ticketId: number): Promise<Buffer | null> {
        const db = await getDb();
        const ticket = await db.get("SELECT transcript FROM TicketTranscripts WHERE id = ?", [ticketId]);
        if (!ticket) return null;

        return Buffer.from(ticket.transcript, 'utf-8');
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const id = interaction.options.getInteger(COMMANDS.TICKET_READ.OPT_ID, true);
        const buf = await this.fetchTranscript(id);

        if (!buf) {
            return interaction.reply({ content: MESSAGES.TICKET_READ_NOT_FOUND, flags: MessageFlags.Ephemeral });
        }

        const attachment = new AttachmentBuilder(buf, { name: `transcript-${id}.txt` });
        return interaction.reply({ 
            content: MESSAGES.TICKET_READ_SUCCESS(id),
            files: [attachment],
            flags: MessageFlags.Ephemeral
        });
    }

    public async messageRun(message: Message, args: Args) {
        if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        const idStr = await args.pick('string').catch(() => null);
        const id = idStr ? parseInt(idStr, 10) : NaN;

        if (isNaN(id)) {
            await (message.channel as any).send({ content: "Por favor, proporciona un ID de ticket válido (número)." }).then((m: Message) => setTimeout(() => m.delete().catch(() => null), 5000));
            return;
        }

        const buf = await this.fetchTranscript(id);
        if (!buf) {
            await (message.channel as any).send({ content: MESSAGES.TICKET_READ_NOT_FOUND });
            return;
        }

        const attachment = new AttachmentBuilder(buf, { name: `transcript-${id}.txt` });
        await (message.channel as any).send({ 
            content: MESSAGES.TICKET_READ_SUCCESS(id),
            files: [attachment]
        });
    }
}
