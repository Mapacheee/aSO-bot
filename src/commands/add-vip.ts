import { Command, Args } from '@sapphire/framework';
import { Message, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';
import { getDb } from '../lib/database';

export class AddVipCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.ADD_VIP.NAME,
            description: COMMANDS.ADD_VIP.DESCRIPTION,
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
                    option.setName(COMMANDS.ADD_VIP.OPT_TEXT)
                        .setDescription(COMMANDS.ADD_VIP.OPT_TEXT_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const text = interaction.options.getString(COMMANDS.ADD_VIP.OPT_TEXT, true);
        
        try {
            const db = await getDb();
            const result = await db.run('INSERT INTO VipBenefits (benefitText) VALUES (?)', [text]);
            
            await interaction.reply({ 
                content: MESSAGES.INFO_SUCCESS_ADD_VIP(result.lastID!.toString(), text), 
                flags: MessageFlags.Ephemeral 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
        }
    }

    public async messageRun(message: Message, args: Args) {
        const text = await args.rest('string').catch(() => null);
        if (!text) {
            await (message.channel as any).send({ content: "Debe proveer el texto del beneficio VIP." });
            return;
        }

        try {
            const db = await getDb();
            const result = await db.run('INSERT INTO VipBenefits (benefitText) VALUES (?)', [text]);
            await message.reply({ content: MESSAGES.INFO_SUCCESS_ADD_VIP(result.lastID!.toString(), text) });
        } catch (error) {
            console.error(error);
            await message.reply({ content: MESSAGES.ERROR_GENERIC });
        }
    }
}
