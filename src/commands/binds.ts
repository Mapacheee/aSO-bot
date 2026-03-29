import { COMMANDS } from '../constants/commands';
import { MESSAGES } from '../constants/messages';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';

export class BindsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.BINDS.NAME,
            description: COMMANDS.BINDS.DESCRIPTION,
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    private getBindsEmbed() {
        return new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(MESSAGES.BINDS_TITLE)
            .setDescription(MESSAGES.BINDS_DESC);
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.reply({ embeds: [this.getBindsEmbed()] });
    }

    public async messageRun(message: Message) {
        await (message.channel as any).send({ embeds: [this.getBindsEmbed()] });
    }
}
