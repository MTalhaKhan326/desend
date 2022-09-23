const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class UserFcmToken extends Model {
  
  static associate(models) {
    // define association here
  }
}

UserFcmToken.init(
  {
    userId: {
        type: DataTypes.INTEGER,
      },
    fcmToken: {
      type: DataTypes.STRING,
    },
    pushNotification: {
      type: DataTypes.BOOLEAN,
    },
 },
  {
    sequelize,
    modelName: "UserFcmToken",
  }
);

module.exports = UserFcmToken;
