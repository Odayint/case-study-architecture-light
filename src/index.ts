import { json } from 'body-parser';

import 'reflect-metadata';
import dotenv from 'dotenv';
import { InversifyExpressServer } from 'inversify-express-utils';

import { getDataSource } from './typeormconfig';

import { diContainer } from '../inversify.config';
import { TYPES } from './lib';

dotenv.config();

(async () => {
    try {
        // DB setup
        const dataSource = await getDataSource();
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('Database connection established');
        diContainer.bind(TYPES.DB).toConstantValue(dataSource);

        console.log('Database connected successfully');

        // Create app server
        const app = new InversifyExpressServer(diContainer, null, {
            rootPath: '/partner-app/api',
        });
        app.setConfig(app => {
            app.use(json());
        });

        const server = app.build();

        const PORT = process.env.PORT || 9000;

        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('database connection failed with error: ', process.env.DATABASE_HOST, process.env.DATABASE_PORT, process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD);
        console.error(err);
        process.exit(1);
    }
})();
