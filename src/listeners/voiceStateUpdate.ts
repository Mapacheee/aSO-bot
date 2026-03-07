import { Listener } from '@sapphire/framework';
import { VoiceState } from 'discord.js';
import { tempVoiceTimeouts, isTempChannel, removeTempChannelFromDb } from '../lib/tempChannels';

export class VoiceStateUpdateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'voiceStateUpdate'
        });
    }

    public async run(oldState: VoiceState, newState: VoiceState) {
        const oldChannel = oldState.channel;

        if (oldChannel) {
            const isTemp = await isTempChannel(oldChannel.id);
            if (isTemp) {
                if (oldChannel.members.size === 0) {
                    const timeout = setTimeout(async () => {
                        try {
                            const channelToDelete = oldState.guild.channels.cache.get(oldChannel.id);
                            if (channelToDelete && channelToDelete.isVoiceBased() && channelToDelete.members.size === 0) {
                                await channelToDelete.delete('Temporary channel empty for 1 minute');
                                await removeTempChannelFromDb(oldChannel.id);
                            }
                        } catch (error) {
                            this.container.logger.error(`Failed to delete temporary channel: ${error}`);
                        }
                        tempVoiceTimeouts.delete(oldChannel.id);
                    }, 60000);

                    tempVoiceTimeouts.set(oldChannel.id, timeout);
                }
            }
        }

        const newChannel = newState.channel;
        if (newChannel) {
            const isTemp = await isTempChannel(newChannel.id);
            if (isTemp) {
                const existingTimeout = tempVoiceTimeouts.get(newChannel.id);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    tempVoiceTimeouts.delete(newChannel.id);
                }
            }
        }
    }
}
