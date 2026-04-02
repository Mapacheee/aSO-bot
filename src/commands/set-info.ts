import { Command, Args } from '@sapphire/framework';
import { Message, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';
import { getDb } from '../lib/database';

export class SetInfoCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.SET_INFO.NAME,
            description: COMMANDS.SET_INFO.DESCRIPTION,
            requiredUserPermissions: ['ManageMessages'],
            preconditions: ['GuildOnly']
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption(option => 
                    option.setName(COMMANDS.SET_INFO.OPT_TIPO)
                        .setDescription(COMMANDS.SET_INFO.OPT_TIPO_DESC)
                        .addChoices(
                            { name: 'Zombie Escape', value: 'zombie_escape' },
                            { name: 'Zombie Mod', value: 'zombie_mod' }
                        )
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName(COMMANDS.SET_INFO.OPT_TEXT)
                        .setDescription(COMMANDS.SET_INFO.OPT_TEXT_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const type = interaction.options.getString(COMMANDS.SET_INFO.OPT_TIPO, true);
        const text = interaction.options.getString(COMMANDS.SET_INFO.OPT_TEXT, true);
        
        try {
            const db = await getDb();
            let key = type === 'zombie_escape' ? 'zombie_escape' : 'zombie_mod';

            await db.run('INSERT OR REPLACE INTO ServerInfo (key, value) VALUES (?, ?)', [key, text]);
            
            await interaction.reply({ 
                content: MESSAGES.INFO_SUCCESS_SET_INFO(key), 
                flags: MessageFlags.Ephemeral 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
        }
    }

    public async messageRun(message: Message, args: Args) {
        const type = await args.pick('string').catch(() => null);
        if (!type || (type !== 'zombie_escape' && type !== 'zombie_mod')) {
            await (message.channel as any).send({ content: "Debe proveer un tipo válido: `zombie_escape` o `zombie_mod`." });
            return;
        }

        const text = await args.rest('string').catch(() => null);
        if (!text) {
            await (message.channel as any).send({ content: "Debe proveer el texto de la información." });
            return;
        }

        try {
            const db = await getDb();
            await db.run('INSERT OR REPLACE INTO ServerInfo (key, value) VALUES (?, ?)', [type, text]);
            await message.reply({ content: MESSAGES.INFO_SUCCESS_SET_INFO(type) });
        } catch (error) {
            console.error(error);
            await message.reply({ content: MESSAGES.ERROR_GENERIC });
        }
    }
}
