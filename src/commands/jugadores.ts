import { Command, Args } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import { GameDig } from 'gamedig';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';

export class JugadoresCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.JUGADORES.NAME,
            description: COMMANDS.JUGADORES.DESCRIPTION,
            aliases: ['online']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    private async getPlayersEmbed(): Promise<EmbedBuilder> {
        const ip = process.env.CSGO_SERVER_IP;
        const portStr = process.env.CSGO_SERVER_PORT;
        if (!ip) {
            return new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(MESSAGES.PLAYERS_SERVER_OFFLINE);
        }
        const port = portStr ? parseInt(portStr) : 27015;

        try {
            const state: any = await GameDig.query({
                type: 'csgo',
                host: ip,
                port: port,
                maxRetries: 2
            });

            const playerCount = state.numplayers ?? state.players.length;
            const players: { name: string, raw?: { score?: number, time?: number } }[] = state.players || [];

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(MESSAGES.PLAYERS_TITLE(playerCount, state.maxplayers, state.map));

            if (players.length === 0) {
                embed.setDescription(MESSAGES.PLAYERS_EMPTY);
                return embed;
            }

            const sorted = [...players]
                .filter(p => p.name && p.name.trim() !== '')
                .sort((a, b) => (b.raw?.score ?? 0) - (a.raw?.score ?? 0));

            if (sorted.length === 0) {
                embed.setDescription(`Hay **${playerCount}** jugador(es) conectados (nombres no disponibles).`);
                return embed;
            }

            let list = '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
            for (let i = 0; i < sorted.length; i++) {
                const p = sorted[i];
                const score = p.raw?.score ?? 0;
                const timeSec = p.raw?.time ? Math.floor(p.raw.time) : 0;
                const mins = Math.floor(timeSec / 60);
                const hours = Math.floor(mins / 60);
                const timeStr = hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
                list += `**${i + 1}.** ${p.name} — ⏱️ ${timeStr}\n`;
            }
            list += '━━━━━━━━━━━━━━━━━━━━━━━━━━━';

            const connectIp = `${ip}:${port}`;
            list += `\n\n**Para unirte:**\n\`connect ${connectIp}\``;

            embed.setDescription(list);
            return embed;

        } catch (error) {
            console.error("GameDig Error:", error);
            return new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(MESSAGES.PLAYERS_SERVER_OFFLINE);
        }
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();
        const embed = await this.getPlayersEmbed();
        await interaction.editReply({ embeds: [embed] });
    }

    public async messageRun(message: Message) {
        const embed = await this.getPlayersEmbed();
        await (message.channel as any).send({ embeds: [embed] });
    }
}
