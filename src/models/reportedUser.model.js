const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class ReportedUser extends Model {
  static associate(models) {
    // define association here
  }
}

ReportedUser.init(
  {
    reportBy: {
        type: DataTypes.INTEGER,
      },
    reportto: {
    type: DataTypes.INTEGER,
    },
    comment: {
        type: DataTypes.STRING,
      },
 },
  {
    sequelize,
    modelName: "ReportedUser",
  }
);

module.exports = ReportedUser;
