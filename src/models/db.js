import { Sequelize } from 'sequelize';

import logger from './../utils/logger.js'
import config from '../../config.js';

const logLevel = config.get('logLevel');
const environment = process.env.NODE_ENV || 'development';

let sequelizeConfig = {
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: logLevel === 'debug',
};

if (environment === 'test') {
    sequelizeConfig = {
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    };
  }

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
