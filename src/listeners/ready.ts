import { Listener } from '@sapphire/framework';
import { Client, ActivityType } from 'discord.js';
import { getDb } from '../lib/database';
import { updateCSGOStatus } from '../lib/csgoStatus';

export class ReadyListener extends Listener {
    public constructor(context: Listener.LoaderContext, options: Listener.Options) {
        super(context, {
            ...options,
            once: true,
            event: 'clientReady'
        });
    }

    public async run(client: Client) {
        const { username, id } = client.user!;
        client.user?.setActivity('aSO Zombie Mod/Escape', { type: ActivityType.Playing });
        
        try {
            await getDb();
            this.container.logger.info(`SQLite database initialized`);

            setInterval(() => {
                updateCSGOStatus(client);
            }, 60000);
            
            updateCSGOStatus(client);

        } catch (error) {
            this.container.logger.error(`Database initialization error: ${error}`);
        }

        this.container.logger.info(`Successfully logged in as ${username} (${id})`);
    }
}
