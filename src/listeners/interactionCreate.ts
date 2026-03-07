import { Listener } from '@sapphire/framework';
import { Interaction, ModalSubmitInteraction, ButtonInteraction, ChannelType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { parseDuration } from '../lib/utils';
import { addTempChannelToDb } from '../lib/tempChannels';

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
        }
    }
}
