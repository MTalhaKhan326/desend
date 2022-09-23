const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class Permission extends Model {
  static associate(models) {
    // define association here
  }
}

Permission.init(
  {
    name: {
      type: DataTypes.STRING,
    },
 },
  {
    sequelize,
    modelName: "Permission",
  }
);

module.exports = Permission;
