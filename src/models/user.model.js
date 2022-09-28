const { Model, DataTypes } = require("sequelize");
var crypto = require("crypto");
const ForgotPasswordToken = require('../models/forgotPasswordToken.model')
const sequelize = require("../config/db.config");
const jwt = require('jsonwebtoken')


class User extends Model {
  getJWTToken() {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET_KEY)
  }
  static createHashFromString(data) {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  async generateForgotPasswordToken(user, len) {
    const resetToken = crypto.randomBytes(len).toString('hex')

    const hashedToken = User.createHashFromString(resetToken)

    const expiresIn =
      Date.now() + parseInt(process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN)

    if (this.ForgotPasswordToken) {
      this.ForgotPasswordToken.token = hashedToken
      this.ForgotPasswordToken.expiresIn = expiresIn
      this.ForgotPasswordToken.userId = user
      this.ForgotPasswordToken.save()
    } else {
      await ForgotPasswordToken.create({
        token: hashedToken,
        expiresIn,
        userId: user,
      })
    }

    return resetToken
  }

  static associate(models) {
    // define association here
  }
}

User.init(
  {
    firstName: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastName: {
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true
    },
    profileImg: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    userType: {
      type: DataTypes.STRING,
    },
    statusMessage: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    backup: {
      type: DataTypes.JSON,
    },
    isBackup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fromGoogle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false

    },
    fromFacebook: {
      type: DataTypes.BOOLEAN,
      defaultValue: false

    },
    fromTwitter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false

    },
    fromApple: {
      type: DataTypes.BOOLEAN,
      defaultValue: false

    },
    socialLoginId: {
      type: DataTypes.TEXT,
    }
  },
  {
    sequelize,
    modelName: "User",
  }
);

// User.sync({alter: true}) 

module.exports = User;
