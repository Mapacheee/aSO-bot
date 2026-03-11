import { Listener } from '@sapphire/framework';
import { Interaction, ModalSubmitInteraction, ButtonInteraction, ChannelType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { parseDuration } from '../lib/utils';
import { addTempChannelToDb } from '../lib/tempChannels';
import { getDb } from '../lib/database';
import { startGiveawayTimer } from '../lib/giveawayManager';
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
        }
    }
}
