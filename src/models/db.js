import { Sequelize } from 'sequelize';

import logger from './../utils/logger.js'
import config from '../../config.js';

const logLevel = config.get('logLevel');

const sequelizeConfig = {
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: logLevel === 'debug',
};

const sequelize = new Sequelize(sequelizeConfig);

async function initDb(){
    try{
        logger.info('Connecting to Database...')
        await sequelize.authenticate();
        logger.info('Database connected!');
        await sequelize.sync({ alter: false });
        logger.info('Database tables are synchronized!')
    }
    catch(error){
        logger.error('Error connecting to database', error)
        throw error;
    }
}

export { sequelize, initDb };
