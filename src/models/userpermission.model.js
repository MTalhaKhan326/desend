const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class UserPermission extends Model {
  static associate(models) {
    // define association here
  }
}

UserPermission.init(
  {
      userId: {
        type: DataTypes.INTEGER,
      },
      permissionId: {
        type: DataTypes.INTEGER,
      },
      name:{
        type: DataTypes.STRING,
      }
 },
  {
    sequelize,
    modelName: "UserPermission",
  }
);

module.exports = UserPermission;
