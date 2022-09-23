require('dotenv').config()
require('../models')

const sequelize = require('./../config/db.config');

const syncModelsWithDB = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({ alter: true })
        console.log('Models Sync Succesfully')
    } catch (error) {
        console.log('There is some error in syncing models', error)
    }
}

syncModelsWithDB()
