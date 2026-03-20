import { getDb } from './database';
import { MESSAGES } from '../constants/messages';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

const BAR_LENGTH = 10;
const BAR_FILLED = '█';
const BAR_EMPTY = '░';

interface NominationMap {
    mapName: string;
    nominatorId: string;
    votes: number;
}

export const getNominationData = async (messageId: string): Promise<{ maps: NominationMap[], total: number }> => {
    const db = await getDb();

    const maps = await db.all(
        "SELECT mapName, nominatorId FROM NominationMaps WHERE messageId = ? ORDER BY id ASC",
        [messageId]
    );

    const voteCounts = await db.all(
        "SELECT mapName, COUNT(*) as cnt FROM NominationVotes WHERE messageId = ? GROUP BY mapName",
        [messageId]
    );

    const voteMap = new Map<string, number>();
    for (const row of voteCounts) {
        voteMap.set(row.mapName, row.cnt);
    }

    let total = 0;
    const result: NominationMap[] = maps.map((m: any) => {
        const votes = voteMap.get(m.mapName) || 0;
        total += votes;
        return { mapName: m.mapName, nominatorId: m.nominatorId, votes };
    });

    return { maps: result, total };
};

export const buildNominationMessage = (title: string, maps: NominationMap[], total: number, closed: boolean = false) => {
    const header = closed ? MESSAGES.NOM_CLOSED_TITLE(title) : MESSAGES.NOM_TITLE(title);
    const separator = '━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    if (maps.length === 0) {
        return `${header}\n${separator}${MESSAGES.NOM_EMPTY}\n${separator}`;
    }

    let body = `\n${separator}`;
    for (const map of maps) {
        const percent = total > 0 ? Math.round((map.votes / total) * 100) : 0;
        const filled = total > 0 ? Math.round((map.votes / total) * BAR_LENGTH) : 0;
        const bar = BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(BAR_LENGTH - filled);
        body += `\n🗺️ **${map.mapName}** — \`${bar}\` ${map.votes} (${percent}%) — <@${map.nominatorId}>`;
    }
    body += `\n${separator}`;
    body += MESSAGES.NOM_TOTAL_VOTES(total);

    return `${header}\n${body}`;
};

export const buildNominationComponents = (maps: NominationMap[], closed: boolean = false) => {
    const rows: ActionRowBuilder<any>[] = [];

    if (maps.length > 0 && !closed) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('nom_vote')
            .setPlaceholder(MESSAGES.NOM_VOTE_PLACEHOLDER)
            .addOptions(maps.map(m => ({
                label: m.mapName,
                value: m.mapName,
                emoji: '🗺️'
            })));
        rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu));
    }

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();
    if (!closed) {
        buttonRow.addComponents(
            new ButtonBuilder()
                .setCustomId('nom_add')
                .setLabel(MESSAGES.NOM_ADD_BUTTON)
                .setStyle(ButtonStyle.Primary)
        );
    }

    const adminSelect = new StringSelectMenuBuilder()
        .setCustomId('nom_admin')
        .setPlaceholder('⚙️ Admin');

    if (closed) {
        adminSelect.addOptions([
            { label: '🔓 Reabrir nominaciones', value: 'reopen' },
            { label: '♻️ Reiniciar todo', value: 'full_reset' }
        ]);
    } else {
        adminSelect.addOptions([
            { label: '🔄 Reiniciar votación', value: 'reset_votes' },
            { label: '🗑️ Borrar mapa', value: 'delete_map' },
            { label: '🔒 Cerrar nominaciones', value: 'close' },
            { label: '♻️ Reiniciar todo', value: 'full_reset' }
        ]);
    }

    if (buttonRow.components.length > 0) {
        rows.push(buttonRow);
    }
    rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(adminSelect));

    return rows;
};

export const refreshNominationMessage = async (message: any, session: any) => {
    const { maps, total } = await getNominationData(session.messageId);
    const closed = session.status !== 'active';
    const content = buildNominationMessage(session.title, maps, total, closed);
    const components = buildNominationComponents(maps, closed);
    await message.edit({ content, components });
};
