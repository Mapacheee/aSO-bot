import { Listener } from '@sapphire/framework';
import { GuildMember, TextChannel, AttachmentBuilder } from 'discord.js';
import { MESSAGES } from '../constants/messages';
import { IMAGES } from '../constants/images';
import { FONT } from '../constants/font';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';

export class GuildMemberUpdateListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            event: 'guildMemberUpdate'
        });

        GlobalFonts.registerFromPath(path.join(process.cwd(), 'assets', FONT.FILE_NAME), FONT.NAME);
    }

    public async run(oldMember: GuildMember, newMember: GuildMember) {
        const justBoosted = !oldMember.premiumSince && newMember.premiumSince;
        if (!justBoosted) return;

        const boostChannelId = process.env.BOOST_CHANNEL_ID;
        const bannerFileName = IMAGES.BOOST_BANNER;

        if (!boostChannelId || !bannerFileName) return;

        const channel = newMember.guild.channels.cache.get(boostChannelId);
        
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

                const textLines = MESSAGES.BOOST(newMember.user.username).split('\n');
                
                const lineHeight = Math.floor(canvas.height / 8) * 1.2;
                const startY = (canvas.height - (textLines.length * lineHeight)) / 2 + (lineHeight / 2);

                textLines.forEach((line, index) => {
                    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
                });

                const buffer = await canvas.encode('png');
                const attachment = new AttachmentBuilder(buffer, { name: 'boost-banner.png' });

                await textChannel.send({
                    content: `🎉 ${newMember.toString()} ha mejorado el servidor. ¡Muchas gracias!`,
                    files: [attachment]
                });
            } catch (error) {
                this.container.logger.error(`Failed to send boost message: ${error}`);
            }
        }
    }
}
