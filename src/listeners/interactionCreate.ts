import { Listener } from '@sapphire/framework';
import { Interaction, ModalSubmitInteraction, ButtonInteraction, ChannelType, PermissionsBitField, GuildMember, MessageFlags, StringSelectMenuInteraction, TextInputStyle } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { parseDuration } from '../lib/utils';
import { addTempChannelToDb } from '../lib/tempChannels';
import { getDb } from '../lib/database';
import { startGiveawayTimer } from '../lib/giveawayManager';
import { buildPollMessage, getVoteCounts } from '../lib/pollManager';
import { getNominationData, buildNominationMessage, buildNominationComponents, refreshNominationMessage } from '../lib/nominationManager';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class InteractionCreateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'interactionCreate'
        });
    }

    public async run(interaction: Interaction) {
        if (interaction.isButton()) {
            await this.handleButton(interaction);
        } else if (interaction.isModalSubmit()) {
            await this.handleModal(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await this.handleSelectMenu(interaction);
        }
    }

    private async handleButton(interaction: ButtonInteraction) {
        if (interaction.customId === 'btn_create_voice') {
            await interaction.showModal({
                title: MESSAGES.VOICE_MODAL_TITLE,
                custom_id: 'modal_create_voice',
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                custom_id: 'voice_limit',
                                label: MESSAGES.VOICE_MEMBERS_LABEL,
                                style: 1,
                                required: true
                            }
                        ]
                    }
                ]
            });
        } else if (interaction.customId === 'giveaway_participate') {
            const db = await getDb();
            try {
                await db.run(
                    'INSERT INTO GiveawayParticipants (messageId, userId) VALUES (?, ?)',
                    [interaction.message.id, interaction.user.id]
                );

                const participants = await db.all("SELECT userId FROM GiveawayParticipants WHERE messageId = ?", [interaction.message.id]);
                const giveaway = await db.get("SELECT endTime, winnersCount, prize FROM Giveaways WHERE messageId = ?", [interaction.message.id]);

                if (giveaway) {
                    const content = `${MESSAGES.GIVEAWAY_TITLE(giveaway.prize)}\n${MESSAGES.GIVEAWAY_DESC(giveaway.endTime, giveaway.winnersCount, participants.length)}`;
                    await interaction.message.edit({ content });
                }

                await interaction.reply({ content: MESSAGES.GIVEAWAY_SUCCESS_PARTICIPATE, flags: MessageFlags.Ephemeral });
            } catch (error: any) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    await interaction.reply({ content: MESSAGES.GIVEAWAY_ALREADY_PARTICIPATING, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.customId.startsWith('poll_vote_')) {
            const optionIndex = parseInt(interaction.customId.replace('poll_vote_', ''));
            const db = await getDb();

            const poll = await db.get("SELECT * FROM Polls WHERE messageId = ?", [interaction.message.id]);
            if (!poll || poll.status !== 'active') {
                await interaction.reply({ content: MESSAGES.POLL_CLOSED, flags: MessageFlags.Ephemeral });
                return;
            }

            try {
                await db.run(
                    'INSERT INTO PollVotes (messageId, userId, optionIndex) VALUES (?, ?, ?)',
                    [interaction.message.id, interaction.user.id, optionIndex]
                );

                const options: string[] = JSON.parse(poll.options);
                const votes = await getVoteCounts(interaction.message.id, options.length);
                const content = buildPollMessage(poll.question, options, votes);
                await interaction.message.edit({ content });
                await interaction.reply({ content: MESSAGES.POLL_SUCCESS_VOTE, flags: MessageFlags.Ephemeral });
            } catch (error: any) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    await interaction.reply({ content: MESSAGES.POLL_ALREADY_VOTED, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.customId === 'poll_close') {
            const db = await getDb();
            const poll = await db.get("SELECT * FROM Polls WHERE messageId = ?", [interaction.message.id]);

            if (!poll) return;

            if (poll.creatorId !== interaction.user.id) {
                await interaction.reply({ content: MESSAGES.POLL_NOT_CREATOR, flags: MessageFlags.Ephemeral });
                return;
            }

            if (poll.status !== 'active') {
                await interaction.reply({ content: MESSAGES.POLL_CLOSED, flags: MessageFlags.Ephemeral });
                return;
            }

            await db.run("UPDATE Polls SET status = 'closed' WHERE messageId = ?", [interaction.message.id]);

            const options: string[] = JSON.parse(poll.options);
            const votes = await getVoteCounts(interaction.message.id, options.length);
            const content = buildPollMessage(poll.question, options, votes, true);

            const disabledRows: ActionRowBuilder<ButtonBuilder>[] = [];
            for (const row of interaction.message.components) {
                const newRow = new ActionRowBuilder<ButtonBuilder>();
                for (const component of (row as any).components) {
                    newRow.addComponents(
                        ButtonBuilder.from(component as any).setDisabled(true)
                    );
                }
                disabledRows.push(newRow);
            }

            await interaction.message.edit({ content, components: disabledRows });
            await interaction.reply({ content: '✅ Votación cerrada.', flags: MessageFlags.Ephemeral });
        } else if (interaction.customId === 'nom_add') {
            const db = await getDb();
            const session = await db.get("SELECT * FROM NominationSessions WHERE messageId = ?", [interaction.message.id]);
            if (!session || session.status !== 'active') {
                await interaction.reply({ content: MESSAGES.NOM_CLOSED, flags: MessageFlags.Ephemeral });
                return;
            }

            if (session.adminsOnly === 1) {
                const member = interaction.member as GuildMember;
                if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                    await interaction.reply({ content: MESSAGES.NOM_ADMINS_ONLY_ERROR, flags: MessageFlags.Ephemeral });
                    return;
                }
            }

            await interaction.showModal({
                title: MESSAGES.NOM_MAP_MODAL_TITLE,
                custom_id: `nom_map_modal_${interaction.message.id}`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                custom_id: 'nom_map_name',
                                label: MESSAGES.NOM_MAP_LABEL,
                                style: 1 as any,
                                placeholder: 'ze_mako_v9',
                                required: true
                            }
                        ]
                    }
                ]
            });
        } else if (interaction.customId === 'btn_notif_clear') {
            const db = await getDb();
            const result = await db.run('DELETE FROM MapSubscriptions WHERE userId = ?', [interaction.user.id]);
            if (result.changes && result.changes > 0) {
                await interaction.reply({ content: MESSAGES.MAP_CLEARED, flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: "No tienes notificaciones activas para limpiar.", flags: MessageFlags.Ephemeral });
            }
        } else if (interaction.customId === 'btn_notif_add' || interaction.customId === 'btn_notif_remove') {
            const isAdd = interaction.customId === 'btn_notif_add';
            await interaction.showModal({
                title: isAdd ? MESSAGES.NOTIF_MODAL_ADD_TITLE : MESSAGES.NOTIF_MODAL_REMOVE_TITLE,
                custom_id: isAdd ? 'modal_notif_add' : 'modal_notif_remove',
                components: [{
                    type: 1,
                    components: [{
                        type: 4,
                        custom_id: 'notif_map_name',
                        label: MESSAGES.NOTIF_MODAL_LABEL,
                        style: 1 as any,
                        required: true
                    }]
                }]
            });
        }
    }

    private async handleSelectMenu(interaction: StringSelectMenuInteraction) {
        if (interaction.customId === 'nom_vote') {
            const db = await getDb();
            const session = await db.get("SELECT * FROM NominationSessions WHERE messageId = ?", [interaction.message.id]);
            if (!session || session.status !== 'active') {
                await interaction.reply({ content: MESSAGES.NOM_CLOSED, flags: MessageFlags.Ephemeral });
                return;
            }

            const mapName = interaction.values[0];
            const existing = await db.get(
                "SELECT mapName FROM NominationVotes WHERE messageId = ? AND userId = ?",
                [interaction.message.id, interaction.user.id]
            );

            if (existing) {
                await db.run(
                    "UPDATE NominationVotes SET mapName = ? WHERE messageId = ? AND userId = ?",
                    [mapName, interaction.message.id, interaction.user.id]
                );
            } else {
                await db.run(
                    'INSERT INTO NominationVotes (messageId, userId, mapName) VALUES (?, ?, ?)',
                    [interaction.message.id, interaction.user.id, mapName]
                );
            }

            await refreshNominationMessage(interaction.message, session);
            const msg = existing ? MESSAGES.NOM_ALREADY_VOTED : MESSAGES.NOM_SUCCESS_VOTE(mapName);
            await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
        } else if (interaction.customId === 'nom_admin') {
            const member = interaction.member as GuildMember;
            if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                await interaction.reply({ content: MESSAGES.NOM_NOT_ADMIN, flags: MessageFlags.Ephemeral });
                return;
            }

            const db = await getDb();
            const session = await db.get("SELECT * FROM NominationSessions WHERE messageId = ?", [interaction.message.id]);
            if (!session) return;

            const action = interaction.values[0];

            if (action === 'reset_votes') {
                await db.run("DELETE FROM NominationVotes WHERE messageId = ?", [interaction.message.id]);
                await refreshNominationMessage(interaction.message, session);
                await interaction.reply({ content: MESSAGES.NOM_RESET_VOTES, flags: MessageFlags.Ephemeral });
            } else if (action === 'toggle_admins_only') {
                const newAdminsOnly = session.adminsOnly === 1 ? 0 : 1;
                await db.run("UPDATE NominationSessions SET adminsOnly = ? WHERE messageId = ?", [newAdminsOnly, interaction.message.id]);
                session.adminsOnly = newAdminsOnly;
                await refreshNominationMessage(interaction.message, session);
                await interaction.reply({ content: MESSAGES.NOM_TOGGLED_ADMINS(newAdminsOnly === 1), flags: MessageFlags.Ephemeral });
            } else if (action === 'delete_map') {
                await interaction.showModal({
                    title: MESSAGES.NOM_DELETE_MODAL_TITLE,
                    custom_id: `nom_delete_modal_${interaction.message.id}`,
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: 'nom_delete_name',
                                    label: MESSAGES.NOM_DELETE_LABEL,
                                    style: 1 as any,
                                    required: true
                                }
                            ]
                        }
                    ]
                });
            } else if (action === 'close') {
                await db.run("UPDATE NominationSessions SET status = 'closed' WHERE messageId = ?", [interaction.message.id]);
                session.status = 'closed';
                await refreshNominationMessage(interaction.message, session);
                await interaction.reply({ content: MESSAGES.NOM_SESSION_CLOSED, flags: MessageFlags.Ephemeral });
            } else if (action === 'reopen') {
                await db.run("UPDATE NominationSessions SET status = 'active' WHERE messageId = ?", [interaction.message.id]);
                session.status = 'active';
                await refreshNominationMessage(interaction.message, session);
                await interaction.reply({ content: MESSAGES.NOM_SESSION_REOPENED, flags: MessageFlags.Ephemeral });
            } else if (action === 'full_reset') {
                await db.run("DELETE FROM NominationMaps WHERE messageId = ?", [interaction.message.id]);
                await db.run("DELETE FROM NominationVotes WHERE messageId = ?", [interaction.message.id]);
                await db.run("UPDATE NominationSessions SET status = 'active' WHERE messageId = ?", [interaction.message.id]);
                session.status = 'active';
                await refreshNominationMessage(interaction.message, session);
                await interaction.reply({ content: MESSAGES.NOM_FULL_RESET, flags: MessageFlags.Ephemeral });
            }
        }
    }

    private async handleModal(interaction: ModalSubmitInteraction) {
        const { customId, guild, member } = interaction;
        if (!guild || !member) return;

        if (customId === 'modal_create_voice') {
            const limitStr = interaction.fields.getTextInputValue('voice_limit');
            const limit = parseInt(limitStr);

            if (isNaN(limit)) {
                await interaction.reply({ content: MESSAGES.ERROR_INVALID_NUMBER, flags: MessageFlags.Ephemeral });
                return;
            }

            const channel = await guild.channels.create({
                name: `${MESSAGES.VOICE_CHANNEL_PREFIX}${(member as GuildMember).user.username}`,
                type: ChannelType.GuildVoice,
                userLimit: limit,
                parent: interaction.channel && 'parentId' in interaction.channel ? interaction.channel.parentId : null,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                    }
                ]
            });

            await addTempChannelToDb(channel.id);
            await interaction.reply({ content: MESSAGES.SUCCESS_VOICE_CREATED, flags: MessageFlags.Ephemeral });
        } else if (customId.startsWith('modal_mute_')) {
            const targetId = customId.split('_')[2];
            const durationStr = interaction.fields.getTextInputValue('mute_duration');
            const parsedDuration = parseDuration(durationStr);

            if (!parsedDuration) {
                await interaction.reply({ content: MESSAGES.ERROR_INVALID_TIME_FORMAT, flags: MessageFlags.Ephemeral });
                return;
            }

            const target = await guild.members.fetch(targetId).catch(() => null);
            if (!target) {
                await interaction.reply({ content: MESSAGES.ERROR_USER_NOT_FOUND, flags: MessageFlags.Ephemeral });
                return;
            }

            await target.timeout(parsedDuration, 'Mod Mute');
            await interaction.reply({ content: MESSAGES.SUCCESS_MUTE(target.user.username, durationStr), flags: MessageFlags.Ephemeral });
        } else if (customId.startsWith('modal_ban_')) {
            const targetId = customId.split('_')[2];
            const durationStr = interaction.fields.getTextInputValue('ban_duration');
            const parsedDuration = parseDuration(durationStr);

            if (!parsedDuration) {
                await interaction.reply({ content: MESSAGES.ERROR_INVALID_TIME_FORMAT, flags: MessageFlags.Ephemeral });
                return;
            }

            const target = await guild.members.fetch(targetId).catch(() => null);
            if (!target) {
                await interaction.reply({ content: MESSAGES.ERROR_USER_NOT_FOUND, flags: MessageFlags.Ephemeral });
                return;
            }

            await target.ban({ reason: `Banned for ${durationStr}` });
            setTimeout(() => {
                guild.members.unban(targetId).catch(() => null);
            }, parsedDuration);

            await interaction.reply({ content: MESSAGES.SUCCESS_BAN(target.user.username, durationStr), flags: MessageFlags.Ephemeral });
        } else if (customId.startsWith('modal_clear_')) {
            const targetId = customId.split('_')[2];
            const countStr = interaction.fields.getTextInputValue('clear_count');
            const count = parseInt(countStr);
            
            if (isNaN(count) || count < 1 || count > 100) {
                await interaction.reply({ content: MESSAGES.ERROR_INVALID_NUMBER, flags: MessageFlags.Ephemeral });
                return;
            }

            if (interaction.channel && interaction.channel.isTextBased()) {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                const toDelete = messages.filter(m => m.author.id === targetId).first(count);
                
                if (toDelete.length > 0 && 'bulkDelete' in interaction.channel) {
                    await (interaction.channel as any).bulkDelete(toDelete);
                }
                
                await interaction.reply({ content: MESSAGES.SUCCESS_CLEAR(toDelete.length.toString(), targetId), flags: MessageFlags.Ephemeral });
            }
        } else if (customId === 'modal_channel_clear') {
            const amountStr = interaction.fields.getTextInputValue('clear_amount').trim().toLowerCase();
            
            if (interaction.channel && interaction.channel.isTextBased()) {
                let toDeleteCount = 0;
                
                if (amountStr === 'all') {
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    toDeleteCount = messages.size;
                    
                    if (toDeleteCount > 0 && 'bulkDelete' in interaction.channel) {
                        await (interaction.channel as any).bulkDelete(messages);
                    }
                } else {
                    const count = parseInt(amountStr);
                    if (isNaN(count) || count < 1 || count > 100) {
                        return interaction.reply({ content: MESSAGES.ERROR_INVALID_NUMBER, flags: MessageFlags.Ephemeral });
                    }
                    
                    const messages = await interaction.channel.messages.fetch({ limit: count });
                    toDeleteCount = messages.size;
                    
                    if (toDeleteCount > 0 && 'bulkDelete' in interaction.channel) {
                        await (interaction.channel as any).bulkDelete(messages);
                    }
                }
                
                await interaction.reply({ content: MESSAGES.SUCCESS_CHANNEL_CLEAR(toDeleteCount.toString()), flags: MessageFlags.Ephemeral });
            }
        } else if (customId === 'giveaway_modal') {
            const durationStr = interaction.fields.getTextInputValue('giveaway_duration');
            const prize = interaction.fields.getTextInputValue('giveaway_prize');
            const winnersCountStr = interaction.fields.getTextInputValue('giveaway_winners');
            const acknowledgments = interaction.fields.getTextInputValue('giveaway_acknowledgments');

            const duration = parseDuration(durationStr);
            const winnersCount = parseInt(winnersCountStr);

            if (!duration) {
                await interaction.reply({ content: MESSAGES.GIVEAWAY_TIME_ERROR, flags: MessageFlags.Ephemeral });
                return;
            }

            if (isNaN(winnersCount) || winnersCount < 1) {
                await interaction.reply({ content: MESSAGES.GIVEAWAY_MIN_WINNERS_ERROR, flags: MessageFlags.Ephemeral });
                return;
            }

            const endTime = Math.floor((Date.now() + duration) / 1000);

            const content = `${MESSAGES.GIVEAWAY_TITLE(prize)}\n${MESSAGES.GIVEAWAY_DESC(endTime, winnersCount, 0)}`;
            
            const embeds = [];
            if (acknowledgments && acknowledgments.trim()) {
                const thanksEmbed = new EmbedBuilder()
                    .setTitle(MESSAGES.GIVEAWAY_ACKNOWLEDGMENTS_TITLE)
                    .setDescription(acknowledgments)
                    .setColor('#00ffcc');
                embeds.push(thanksEmbed);
            }

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('giveaway_participate')
                    .setLabel(MESSAGES.GIVEAWAY_PARTICIPATE_BUTTON)
                    .setStyle(ButtonStyle.Success)
            );

            const message = await interaction.reply({
                content,
                embeds: embeds.length > 0 ? embeds : undefined,
                components: [row],
                fetchReply: true
            });

            const db = await getDb();
            await db.run(
                'INSERT INTO Giveaways (messageId, channelId, prize, winnersCount, endTime, acknowledgments) VALUES (?, ?, ?, ?, ?, ?)',
                [message.id, interaction.channelId, prize, winnersCount, endTime, acknowledgments || null]
            );

            startGiveawayTimer(interaction.client, message.id, endTime);
        } else if (customId === 'poll_modal') {
            const question = interaction.fields.getTextInputValue('poll_question');
            const optionsRaw = interaction.fields.getTextInputValue('poll_options');
            const options = optionsRaw.split('\n').map(o => o.trim()).filter(o => o.length > 0);

            if (options.length < 2) {
                await interaction.reply({ content: MESSAGES.POLL_MIN_OPTIONS_ERROR, flags: MessageFlags.Ephemeral });
                return;
            }

            if (options.length > 10) {
                await interaction.reply({ content: MESSAGES.POLL_MAX_OPTIONS_ERROR, flags: MessageFlags.Ephemeral });
                return;
            }

            const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const votes = new Array(options.length).fill(0);
            const content = buildPollMessage(question, options, votes);

            const rows: ActionRowBuilder<ButtonBuilder>[] = [];
            let currentRow = new ActionRowBuilder<ButtonBuilder>();

            for (let i = 0; i < options.length; i++) {
                if (i > 0 && i % 5 === 0) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder<ButtonBuilder>();
                }
                currentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`poll_vote_${i}`)
                        .setLabel(NUMBER_EMOJIS[i])
                        .setStyle(ButtonStyle.Primary)
                );
            }
            rows.push(currentRow);

            const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('poll_close')
                    .setLabel(MESSAGES.POLL_CLOSE_BUTTON)
                    .setStyle(ButtonStyle.Danger)
            );
            rows.push(closeRow);

            const message = await interaction.reply({
                content,
                components: rows,
                fetchReply: true
            });

            const db = await getDb();
            await db.run(
                'INSERT INTO Polls (messageId, channelId, question, options, creatorId) VALUES (?, ?, ?, ?, ?)',
                [message.id, interaction.channelId, question, JSON.stringify(options), interaction.user.id]
            );
        } else if (customId === 'nom_setup_modal') {
            const title = interaction.fields.getTextInputValue('nom_title');

            const { maps, total } = { maps: [], total: 0 };
            const content = buildNominationMessage(title, maps, total);
            const components = buildNominationComponents(maps);

            const message = await interaction.reply({
                content,
                components,
                fetchReply: true
            });

            const db = await getDb();
            await db.run(
                'INSERT INTO NominationSessions (messageId, channelId, title, creatorId) VALUES (?, ?, ?, ?)',
                [message.id, interaction.channelId, title, interaction.user.id]
            );
        } else if (customId.startsWith('nom_map_modal_')) {
            const messageId = customId.replace('nom_map_modal_', '');
            const db = await getDb();
            const session = await db.get("SELECT * FROM NominationSessions WHERE messageId = ?", [messageId]);
            if (!session || session.status !== 'active') {
                await interaction.reply({ content: MESSAGES.NOM_CLOSED, flags: MessageFlags.Ephemeral });
                return;
            }

            const mapName = interaction.fields.getTextInputValue('nom_map_name').trim();

            const existing = await db.get(
                "SELECT id FROM NominationMaps WHERE messageId = ? AND LOWER(mapName) = LOWER(?)",
                [messageId, mapName]
            );

            if (existing) {
                await interaction.reply({ content: MESSAGES.NOM_ALREADY_EXISTS(mapName), flags: MessageFlags.Ephemeral });
                return;
            }

            await db.run(
                'INSERT INTO NominationMaps (messageId, mapName, nominatorId) VALUES (?, ?, ?)',
                [messageId, mapName, interaction.user.id]
            );

            const channel = await interaction.client.channels.fetch(session.channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                const msg = await (channel as any).messages.fetch(messageId).catch(() => null);
                if (msg) {
                    await refreshNominationMessage(msg, session);
                }
            }

            await interaction.reply({ content: MESSAGES.NOM_SUCCESS_ADD(mapName), flags: MessageFlags.Ephemeral });
        } else if (customId.startsWith('nom_delete_modal_')) {
            const messageId = customId.replace('nom_delete_modal_', '');
            const db = await getDb();
            const session = await db.get("SELECT * FROM NominationSessions WHERE messageId = ?", [messageId]);
            if (!session) return;

            const mapName = interaction.fields.getTextInputValue('nom_delete_name').trim();

            const result = await db.run(
                "DELETE FROM NominationMaps WHERE messageId = ? AND LOWER(mapName) = LOWER(?)",
                [messageId, mapName]
            );

            if (result.changes && result.changes > 0) {
                await db.run(
                    "DELETE FROM NominationVotes WHERE messageId = ? AND LOWER(mapName) = LOWER(?)",
                    [messageId, mapName]
                );

                const channel = await interaction.client.channels.fetch(session.channelId).catch(() => null);
                if (channel && channel.isTextBased()) {
                    const msg = await (channel as any).messages.fetch(messageId).catch(() => null);
                    if (msg) {
                        await refreshNominationMessage(msg, session);
                    }
                }

                await interaction.reply({ content: MESSAGES.NOM_DELETED_MAP(mapName), flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: MESSAGES.NOM_MAP_NOT_FOUND(mapName), flags: MessageFlags.Ephemeral });
            }
        } else if (customId === 'modal_notif_add' || customId === 'modal_notif_remove') {
            const isAdd = customId === 'modal_notif_add';
            const mapName = interaction.fields.getTextInputValue('notif_map_name').trim();
            if (mapName.includes(' ') || mapName.includes('@')) {
                await interaction.reply({ content: MESSAGES.MAP_INVALID_NAME, flags: MessageFlags.Ephemeral });
                return;
            }

            const db = await getDb();
            if (isAdd) {
                await db.run(
                    'INSERT INTO MapSubscriptions (userId, mapName, channelId) VALUES (?, ?, ?)',
                    [interaction.user.id, mapName, interaction.channelId]
                );
                await interaction.reply({ content: MESSAGES.MAP_SUBSCRIBED(mapName), flags: MessageFlags.Ephemeral });
            } else {
                const result = await db.run(
                    'DELETE FROM MapSubscriptions WHERE userId = ? AND LOWER(mapName) LIKE LOWER(?)',
                    [interaction.user.id, `%${mapName}%`]
                );
                if (result.changes && result.changes > 0) {
                    await interaction.reply({ content: MESSAGES.MAP_UNSUBSCRIBED(mapName), flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: MESSAGES.MAP_NOT_SUBSCRIBED(mapName), flags: MessageFlags.Ephemeral });
                }
            }
        }
    }
}
