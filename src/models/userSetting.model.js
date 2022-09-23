const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class UserSetting extends Model {
  
  static associate(models) {
    // define association here
  }
}

UserSetting.init(
  {
    userId: {
        type: DataTypes.INTEGER,
      },
    pushNotification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    chatBackup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    disappearingMessages: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
 },
  {
    sequelize,
    modelName: "UserSetting",
  }
);

module.exports = UserSetting;
