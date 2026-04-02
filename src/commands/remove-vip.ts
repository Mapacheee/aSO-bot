import { Command, Args } from '@sapphire/framework';
import { Message, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { COMMANDS } from '../constants/commands';
import { getDb } from '../lib/database';

export class RemoveVipCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, {
            ...options,
            name: COMMANDS.REMOVE_VIP.NAME,
            description: COMMANDS.REMOVE_VIP.DESCRIPTION,
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
                    option.setName(COMMANDS.REMOVE_VIP.OPT_ID)
                        .setDescription(COMMANDS.REMOVE_VIP.OPT_ID_DESC)
                        .setRequired(true)
                )
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const idStr = interaction.options.getString(COMMANDS.REMOVE_VIP.OPT_ID, true);
        const id = parseInt(idStr);

        if (isNaN(id)) {
            return interaction.reply({ content: MESSAGES.ERROR_INVALID_NUMBER, flags: MessageFlags.Ephemeral });
        }
        
        try {
            const db = await getDb();
            const result = await db.run('DELETE FROM VipBenefits WHERE id = ?', [id]);
            
            if (result.changes && result.changes > 0) {
                await interaction.reply({ 
                    content: MESSAGES.INFO_SUCCESS_REMOVE_VIP(idStr), 
                    flags: MessageFlags.Ephemeral 
                });
            } else {
                await interaction.reply({ 
                    content: MESSAGES.INFO_NOT_FOUND(idStr), 
                    flags: MessageFlags.Ephemeral 
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: MESSAGES.ERROR_GENERIC, flags: MessageFlags.Ephemeral });
        }
    }

    public async messageRun(message: Message, args: Args) {
        const idStr = await args.pick('string').catch(() => null);
        if (!idStr) {
            await (message.channel as any).send({ content: "Debe proveer el ID del beneficio VIP a eliminar." });
            return;
        }

        const id = parseInt(idStr);
        if (isNaN(id)) {
            await message.reply({ content: MESSAGES.ERROR_INVALID_NUMBER });
            return;
        }

        try {
            const db = await getDb();
            const result = await db.run('DELETE FROM VipBenefits WHERE id = ?', [id]);
            
            if (result.changes && result.changes > 0) {
                await message.reply({ content: MESSAGES.INFO_SUCCESS_REMOVE_VIP(idStr) });
            } else {
                await message.reply({ content: MESSAGES.INFO_NOT_FOUND(idStr) });
            }
        } catch (error) {
            console.error(error);
            await message.reply({ content: MESSAGES.ERROR_GENERIC });
        }
    }
}
