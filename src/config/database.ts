import { SequelizeModuleOptions } from '@nestjs/sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

export const databaseConfig: SequelizeModuleOptions = {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'gg_cargo',
    autoLoadModels: true,
    synchronize: false,
    logging: false,
    pool: {
        max: 50,
        min: 5,
        acquire: 30000,
        idle: 10000,
        evict: 5000,
    },
    retry: {
        match: [/Deadlock/i, /ConnectionError/i],
        max: 3,
        backoffBase: 3000,
        backoffExponent: 1.5,
    },
};
