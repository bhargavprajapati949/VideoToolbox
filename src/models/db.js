import { Sequelize } from 'sequelize';

const config = {
    dialect: 'sqlite',
    storage: 'database.sqlite',
};

const sequelize = new Sequelize(config);

async function initDb(){
    try{
        await sequelize.authenticate();
        console.log('Database connected!');
    }
    catch(error){
        console.log('Error connecting to database')
        throw error;
    }
}

export { sequelize, initDb };
