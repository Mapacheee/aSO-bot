import { ButtonInteraction, ModalSubmitInteraction, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, ThreadAutoArchiveDuration, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import { getDb } from './database';
import { MESSAGES } from '../constants/messages';

export const handleCreateSuggestionClick = async (interaction: ButtonInteraction) => {
    await interaction.showModal({
        title: MESSAGES.SUG_MODAL_TITLE,
        custom_id: 'modal_sug_create',
        components: [{
            type: 1,
            components: [{
                type: 4,
                custom_id: 'sug_content',
                label: MESSAGES.SUG_MODAL_LABEL,
                style: 2,
                required: true,
                max_length: 2000
            }]
        }]
    });
};

const buildSuggestionEmbed = (content: string, authorId: string, up = 0, down = 0) => {
    return new EmbedBuilder()
        .setColor('#fadd4b')
        .setTitle(MESSAGES.SUG_EMBED_TITLE)
        .setDescription(MESSAGES.SUG_EMBED_DESC(content, authorId))
        .setFooter({ text: MESSAGES.SUG_EMBED_FOOTER(up, down) });
};

const buildSuggestionButtons = (up = 0, down = 0) => {
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_sug_up').setLabel(MESSAGES.SUG_BTN_UP(up)).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_sug_down').setLabel(MESSAGES.SUG_BTN_DOWN(down)).setStyle(ButtonStyle.Danger)
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_sug_approve').setLabel(MESSAGES.SUG_BTN_APPROVE).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_sug_reject').setLabel(MESSAGES.SUG_BTN_REJECT).setStyle(ButtonStyle.Secondary)
    );
    return [row1, row2];
};

export const handleCreateSuggestionSubmit = async (interaction: ModalSubmitInteraction) => {
    const content = interaction.fields.getTextInputValue('sug_content');
    const channel = interaction.channel as TextChannel;
    if (!channel) return;

    const embed = buildSuggestionEmbed(content, interaction.user.id);
    const components = buildSuggestionButtons(0, 0);

    const message = await channel.send({ embeds: [embed], components });

    try {
        await message.startThread({
            name: MESSAGES.SUG_THREAD_NAME(interaction.user.username),
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
        });
    } catch (e) {
        console.error("Could not create thread for suggestion:", e);
    }

    const db = await getDb();
    await db.run(
        "INSERT INTO Suggestions (messageId, authorId, content, status) VALUES (?, ?, ?, 'pending')",
        [message.id, interaction.user.id, content]
    );

    await interaction.reply({ content: MESSAGES.SUG_CREATED_SUCCESS, flags: MessageFlags.Ephemeral });
};

export const handleSuggestionVote = async (interaction: ButtonInteraction, action: 'up' | 'down') => {
    const db = await getDb();
    const msgId = interaction.message.id;
    const userId = interaction.user.id;

    const sug = await db.get("SELECT status, authorId, content FROM Suggestions WHERE messageId = ?", [msgId]);
    if (!sug || sug.status !== 'pending') {
        await interaction.reply({ content: MESSAGES.SUG_NOT_VOTABLE, flags: MessageFlags.Ephemeral });
        return;
    }

    const currentVote = await db.get("SELECT voteType FROM SuggestionVotes WHERE messageId = ? AND userId = ?", [msgId, userId]);

    if (currentVote && currentVote.voteType === action) {
        await db.run("DELETE FROM SuggestionVotes WHERE messageId = ? AND userId = ?", [msgId, userId]);
    } else {
        await db.run(
            "INSERT OR REPLACE INTO SuggestionVotes (messageId, userId, voteType) VALUES (?, ?, ?)",
            [msgId, userId, action]
        );
    }

    const upvotesData = await db.get("SELECT COUNT(*) as c FROM SuggestionVotes WHERE messageId = ? AND voteType = 'up'", [msgId]);
    const downvotesData = await db.get("SELECT COUNT(*) as c FROM SuggestionVotes WHERE messageId = ? AND voteType = 'down'", [msgId]);
    const up = upvotesData.c || 0;
    const down = downvotesData.c || 0;

    const embed = buildSuggestionEmbed(sug.content, sug.authorId, up, down);
    const components = buildSuggestionButtons(up, down);

    await interaction.update({ embeds: [embed], components });
};

export const handleStaffResolveClick = async (interaction: ButtonInteraction, action: 'approve' | 'reject') => {
    const adminRoleId = process.env.ADMIN_ROLE_ID;
    const isOwner = interaction.guild?.ownerId === interaction.user.id;
    const hasRole = adminRoleId && (interaction.member as any).roles?.cache?.has(adminRoleId);
    const hasPerms = (interaction.member?.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator);

    if (!isOwner && !hasRole && !hasPerms) {
        await interaction.reply({ content: MESSAGES.SUG_NOT_ADMIN, flags: MessageFlags.Ephemeral });
        return;
    }

    const db = await getDb();
    const sug = await db.get("SELECT status FROM Suggestions WHERE messageId = ?", [interaction.message.id]);
    if (!sug || sug.status !== 'pending') {
        await interaction.reply({ content: MESSAGES.SUG_ALREADY_RESOLVED, flags: MessageFlags.Ephemeral });
        return;
    }

    await interaction.showModal({
        title: action === 'approve' ? MESSAGES.SUG_RESOLVED_TITLE_APPROVED : MESSAGES.SUG_RESOLVED_TITLE_REJECTED,
        custom_id: `modal_sug_${action}_${interaction.message.id}`,
        components: [{
            type: 1,
            components: [{
                type: 4,
                custom_id: 'sug_reason',
                label: MESSAGES.SUG_MODAL_RESOLVE_LABEL,
                style: 2,
                required: false,
                max_length: 1000
            }]
        }]
    });
};

export const handleStaffResolveSubmit = async (interaction: ModalSubmitInteraction, action: 'approve' | 'reject', messageId: string) => {
    const resultChannelId = process.env.SUGERENCIAS_RESULT_CHANNEL_ID;
    if (!resultChannelId) {
        await interaction.reply({ content: MESSAGES.SUG_MISSING_RESULT_CHANNEL, flags: MessageFlags.Ephemeral });
        return;
    }

    const db = await getDb();
    const sug = await db.get("SELECT * FROM Suggestions WHERE messageId = ?", [messageId]);
    if (!sug || sug.status !== 'pending') {
        await interaction.reply({ content: MESSAGES.SUG_ALREADY_RESOLVED, flags: MessageFlags.Ephemeral });
        return;
    }

    const reason = interaction.fields.getTextInputValue('sug_reason') || MESSAGES.SUG_REASON_EMPTY;

    await db.run("UPDATE Suggestions SET status = ? WHERE messageId = ?", [action === 'approve' ? 'approved' : 'rejected', messageId]);

    const upvotesData = await db.get("SELECT COUNT(*) as c FROM SuggestionVotes WHERE messageId = ? AND voteType = 'up'", [messageId]);
    const downvotesData = await db.get("SELECT COUNT(*) as c FROM SuggestionVotes WHERE messageId = ? AND voteType = 'down'", [messageId]);
    const up = upvotesData.c || 0;
    const down = downvotesData.c || 0;

    const resultChannel = await interaction.client.channels.fetch(resultChannelId).catch(() => null) as TextChannel;
    if (resultChannel) {
        const finalEmbed = new EmbedBuilder()
            .setColor(action === 'approve' ? '#57F287' : '#ED4245')
            .setTitle(action === 'approve' ? MESSAGES.SUG_RESOLVED_TITLE_APPROVED : MESSAGES.SUG_RESOLVED_TITLE_REJECTED)
            .setDescription(MESSAGES.SUG_FINAL_DESC(sug.content, sug.authorId, up, down, interaction.user.id, reason));
        
        await resultChannel.send({ embeds: [finalEmbed] });
    }

    try {
        const originalChannel = interaction.channel as TextChannel;
        const oMsg = await originalChannel.messages.fetch(messageId).catch(() => null);
        if (oMsg) {
            if (oMsg.thread) await oMsg.thread.delete().catch(() => null);
            await oMsg.delete().catch(() => null);
        }
    } catch (e) {
        console.error("Error cleaning up suggestion message/thread:", e);
    }

    await interaction.reply({ content: MESSAGES.SUG_PROCESSED_SUCCESS(action === 'approve'), flags: MessageFlags.Ephemeral });
};
