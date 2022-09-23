const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class Notification extends Model {
  
  static associate(models) {
    // define association here
  }
}

Notification.init(
  {
    title: {
      type: DataTypes.STRING,
    },
    notification: {
      type: DataTypes.STRING,
    }
 },
  {
    sequelize,
    modelName: "Notification",
  }
);

module.exports = Notification;
