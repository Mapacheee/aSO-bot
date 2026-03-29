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

        let currentChunk = '';
        let chunkIndex = 1;

        for (const key in COMMANDS) {
            const cmd = COMMANDS[key as keyof typeof COMMANDS];
            const line = `**/${cmd.NAME}** - ${cmd.DESCRIPTION}\n`;
            
            if (currentChunk.length + line.length > 1024) {
                embed.addFields({ name: `Comandos (${chunkIndex})`, value: currentChunk });
                currentChunk = line;
                chunkIndex++;
            } else {
                currentChunk += line;
            }
        }

        if (currentChunk.length > 0) {
            embed.addFields({ name: chunkIndex > 1 ? `Comandos (${chunkIndex})` : 'Comandos', value: currentChunk });
        }

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}
