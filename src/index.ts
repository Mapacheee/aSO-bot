import { SapphireClient, ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new SapphireClient({
    baseUserDirectory: __dirname,
    defaultPrefix: '!',
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],
    loadMessageCommandListeners: true,
    loadDefaultErrorListeners: true,
    typing: true
});

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

const main = async () => {
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        client.logger.fatal(error);
        client.destroy();
        process.exit(1);
    }
};

void main();
