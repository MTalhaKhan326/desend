const Sequelize = require('sequelize');
require('dotenv').config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
// const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
//     dialect: 'postgres',
//     host: DB_HOST,
//     port: DB_PORT,
//     logging: false,
//     dialectOptions: {
//         ssl: false
//     }
// })

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false 
        }
    }
})

module.exports = sequelize;
