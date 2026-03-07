import { Command } from '@sapphire/framework';
import { MessageFlags, EmbedBuilder } from 'discord.js';
import { COMMANDS } from '../constants/commands';

export class AyudaCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: COMMANDS.AYUDA.NAME, description: COMMANDS.AYUDA.DESCRIPTION });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        , { idHints: ['1479657782276915463'] });
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setTitle('📖 Lista de Comandos')
            .setDescription('Aquí tienes la lista de todos los comandos disponibles en el bot:')
            .setColor('#2b2d31');

        let commandsList = '';
        for (const key in COMMANDS) {
            const cmd = COMMANDS[key as keyof typeof COMMANDS];
            commandsList += `**/${cmd.NAME}** - ${cmd.DESCRIPTION}\n`;
        }

        embed.addFields({ name: 'Comandos', value: commandsList });

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}
