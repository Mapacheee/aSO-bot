import { Listener } from '@sapphire/framework';
import { GuildMember, TextChannel, AttachmentBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { IMAGES } from '../constants/images';
import { FONT } from '../constants/font';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';

export class GuildMemberAddListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'guildMemberAdd'
        });

        GlobalFonts.registerFromPath(path.join(process.cwd(), 'assets', FONT.FILE_NAME), FONT.NAME);
    }

    public async run(member: GuildMember) {
        const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
        const bannerFileName = IMAGES.WELCOME_BANNER;
        const welcomeRoleId = process.env.WELCOME_ROLE_ID;

        if (!welcomeChannelId || !bannerFileName) return;

        if (welcomeRoleId) {
            try {
                await member.roles.add(welcomeRoleId);
            } catch (error) {
                this.container.logger.error(`Failed to assign welcome role: ${error}`);
            }
        }

        const channel = member.guild.channels.cache.get(welcomeChannelId);
        
        if (channel && channel.isTextBased()) {
            const textChannel = channel as TextChannel;
            
            try {
                const imagePath = bannerFileName.startsWith('http') ? bannerFileName : path.join(process.cwd(), 'assets', bannerFileName);
                const image = await loadImage(imagePath);
                const canvas = createCanvas(image.width, image.height);
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                ctx.font = `bold ${Math.floor(canvas.height / 8)}px "${FONT.NAME}"`;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                const textLines = MESSAGES.WELCOME(member.user.username).split('\n');
                const lineHeight = Math.floor(canvas.height / 8) * 1.2;
                const startY = (canvas.height - (textLines.length * lineHeight)) / 2 + (lineHeight / 2);

                textLines.forEach((line, index) => {
                    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
                });

                const buffer = await canvas.encode('png');
                const attachment = new AttachmentBuilder(buffer, { name: 'welcome-banner.png' });

                await textChannel.send({
                    content: `${member.toString()}`,
                    files: [attachment]
                });
            } catch (error) {
                this.container.logger.error(`Failed to send welcome message: ${error}`);
            }
        }
    }
}
