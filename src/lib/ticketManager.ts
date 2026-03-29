import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChannelType, GuildMember, MessageFlags, TextChannel, EmbedBuilder } from 'discord.js';
import { getDb } from './database';
import { MESSAGES } from '../constants/messages';

export const createTicket = async (interaction: ButtonInteraction, categoryStr: string, buttonLabel: string) => {
    const categoryId = process.env.TICKET_CATEGORY_ID;
    if (!categoryId) {
        await interaction.reply({ content: MESSAGES.TICKET_NO_CATEGORY, flags: MessageFlags.Ephemeral });
        return;
    }

    const guild = interaction.guild;
    if (!guild) return;

    const db = await getDb();
    
    const existing = await db.get(
        "SELECT channelId FROM ActiveTickets WHERE userId = ? AND LOWER(category) = LOWER(?)",
        [interaction.user.id, categoryStr]
    );

    if (existing) {
        await interaction.reply({ content: MESSAGES.TICKET_ALREADY_OPEN(buttonLabel), flags: MessageFlags.Ephemeral });
        return;
    }

    const permissionOverwrites: any[] = [
        {
            id: guild.id,
            deny: ['ViewChannel']
        },
        {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
        }
    ];

    const adminRoleId = process.env.ADMIN_ROLE_ID;
    if (adminRoleId) {
        permissionOverwrites.push({
            id: adminRoleId,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
        });
    }

    const member = interaction.member as GuildMember;
    const cleanName = member.user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
    const channelName = `ticket-${categoryStr}-${cleanName}`;

    try {
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites
        });

        await db.run(
            "INSERT INTO ActiveTickets (channelId, userId, category) VALUES (?, ?, ?)",
            [ticketChannel.id, interaction.user.id, categoryStr]
        );

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setDescription(MESSAGES.TICKET_CHANNEL_WELCOME(interaction.user.id, buttonLabel));

        const closeBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_ticket_close')
                .setLabel(MESSAGES.TICKET_BTN_CLOSE)
                .setStyle(ButtonStyle.Danger)
        );

        const adminPing = adminRoleId ? `<@&${adminRoleId}> ` : '';
        await ticketChannel.send({
            content: `${adminPing}<@${interaction.user.id}>`,
            embeds: [embed],
            components: [closeBtn]
        });

        await interaction.reply({ content: MESSAGES.TICKET_CREATED(ticketChannel.id), flags: MessageFlags.Ephemeral });

    } catch (err) {
        console.error("Error creating ticket:", err);
        await interaction.reply({ content: "Ocurrió un error al crear el ticket. Verifica los permisos del bot.", flags: MessageFlags.Ephemeral });
    }
};

export const closeTicket = async (interaction: ButtonInteraction) => {
    const channel = interaction.channel as TextChannel;
    if (!channel) return;

    const db = await getDb();
    const session = await db.get("SELECT userId, category FROM ActiveTickets WHERE channelId = ?", [channel.id]);

    if (!session) {
        await channel.delete().catch(() => null);
        return;
    }

    await interaction.reply({ content: MESSAGES.TICKET_CLOSING });

    let transcript = '';
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sorted = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        for (const msg of sorted) {
            if (msg.author.bot && msg.embeds.length > 0) continue; // Skip bot welcome embeds
            const date = new Date(msg.createdTimestamp).toISOString().replace('T', ' ').substring(0, 19);
            const content = msg.content || '[Attachment/Embed]';
            transcript += `[${date}] ${msg.author.username}: ${content}\n`;
        }
    } catch (err) {
        console.error("Error fetching messages for transcript:", err);
        transcript = 'Error guardando historial.';
    }

    const now = new Date().toISOString();
    await db.run(
        "INSERT INTO TicketTranscripts (userId, category, transcript, createdAt, closedAt) SELECT userId, category, ?, createdAt, ? FROM ActiveTickets WHERE channelId = ?",
        [transcript, now, channel.id]
    );

    await db.run("DELETE FROM ActiveTickets WHERE channelId = ?", [channel.id]);

    try {
        const user = await interaction.client.users.fetch(session.userId);
        if (user) {
            const buf = Buffer.from(transcript, 'utf-8');
            await user.send({
                content: MESSAGES.TICKET_DM_TRANSCRIPT(session.category),
                files: [{ attachment: buf, name: `transcript-${session.category}.txt` }]
            });
        }
    } catch (err) {
        console.error("Failed to send DM to ticket creator:", err);
    }

    setTimeout(() => {
        channel.delete().catch(() => null);
    }, 3000);
};
