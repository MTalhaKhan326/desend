const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class UserWalletInfo extends Model {}

UserWalletInfo.init({
    recoveryPhrase: {
        type: DataTypes.TEXT
    },
    name: {
        type: DataTypes.TEXT
    },
    passphrase: {
        type: DataTypes.TEXT
    },
    walletId: {
        type: DataTypes.TEXT
    }
}, {
    sequelize,
    modelName: 'UserWalletInfo'
})

module.exports = UserWalletInfo