const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

class ContactList extends Model {

  static associate(models) {
    // define association here
    // this.belongsTo(models.User, {
    //   as: 'user',
    //   foreignKey: 'userId',
    // });
  }
}

ContactList.init(
  {
    contactOf: {
      type: DataTypes.INTEGER,
    },
    contact: {
      type: DataTypes.INTEGER,
    },
    // status is for contact block or not
    status: {
      type: DataTypes.STRING,
      defaultValue: "unblocked"
    },
    chatColor: {
      type: DataTypes.STRING,
    }
  },
  {
    sequelize,
    modelName: "ContactList",
  }
);

module.exports = ContactList;
