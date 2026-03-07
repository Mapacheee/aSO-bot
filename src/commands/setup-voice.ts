import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class SetupVoiceCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.SETUP_VOICE.NAME, description: COMMANDS.SETUP_VOICE.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.memberPermissions?.has('ManageChannels')) {
            return interaction.reply({ content: MESSAGES.ERROR_NO_PERMISSION, flags: MessageFlags.Ephemeral });
        }

        if (interaction.channel && interaction.channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle(MESSAGES.SETUP_VOICE_EMBED_TITLE)
                .setDescription(MESSAGES.SETUP_VOICE_EMBED_DESC)
                .setColor('#4927F5');

            await (interaction.channel as any).send({
                embeds: [embed],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                custom_id: 'btn_create_voice',
                                label: MESSAGES.SETUP_VOICE_BUTTON_LABEL,
                                style: 1
                            }
                        ]
                    }
                ]
            });
            return interaction.reply({ content: MESSAGES.SUCCESS_SETUP_VOICE, flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
    }
}
