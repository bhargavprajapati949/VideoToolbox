import { Sequelize } from 'sequelize';
import logger from './../utils/logger.js'

const config = {
    dialect: 'sqlite',
    storage: 'database.sqlite',
};

const sequelize = new Sequelize(config);

async function initDb(){
    try{
        logger.info('Connecting to Database...')
        await sequelize.authenticate();
        logger.info('Database connected!');
    }
    catch(error){
        logger.error('Error connecting to database', error)
        throw error;
    }
}

export { sequelize, initDb };
