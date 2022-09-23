const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class ChatBackup extends Model {

  static associate(models) {
    // define association here
  }
}

ChatBackup.init(
  {
    userId: {
      type: DataTypes.INTEGER,
    },
    backup: {
      type: DataTypes.JSON,
    },
    chatId: {
      type: DataTypes.INTEGER,
    },
    messageTime: {
      type: DataTypes.DATE
    }
  },
  {
    sequelize,
    modelName: "ChatBackup",
  }
);

module.exports = ChatBackup;
