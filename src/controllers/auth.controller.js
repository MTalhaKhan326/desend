const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generator = require("generate-password");
const { Op } = require("sequelize");
const { validateEmail } = require("../utils/validateEmail");
const ForgotPasswordToken = require("../models/forgotPasswordToken.model");
const { sendEmail, sendForgotPasswordEmail } = require("../utils/sendEmail");
const APIError = require("../utils/APIError.js");
const sequelize = require("sequelize");
const status = require("http-status");
const UserSetting = require("../models/userSetting.model");
const ContactList = require("../models/contactList.model");
const twilio = require("twilio");
const {
  InvalidCredentials,
  UserNotFound,
  success,
  fail,
  otpSent,
  otpVerified,
  invalidOtp,
  phoneRegistered,
} = require("../utils/Error");
const { emailLogin, phoneLogin } = require("../validations/users");
const UserPermission = require("../models/userpermission.model");
const Permission = require("../models/permission.model");
const UserFcmToken = require("../models/userFcmToken.model");
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_SERVICE_SID;

exports.phoneRegistration = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      phone,
      profileImg=null,
      password,
      socialLoginId,
      fromGoogle = false,
      fromFacebook = false,
      fromTwitter = false,
      fromApple = false,
      imageUri = null
    } = req.body;

    // profileImg ? profileImg='':  profileImg=req.file.path
    if (!req.file) {
      profileImg = "";
    }

    if (req.file) {
      profileImg = req.file.location;
    }

    if (imageUri) {
      profileImg = imageUri;
    }

    password = bcrypt.hashSync(password, 8);

    const user = await User.create({
      firstName,
      lastName,
      phone,
      password,
      profileImg,
      socialLoginId,
      userType: "user",
      fromGoogle,
      fromFacebook,
      fromTwitter,
      fromApple,
    });

    const userSetting = await UserSetting.create({
      userId: user.id,
    });

    return res.status(status.OK).json({
      status: success,
      user,
      userSetting,
    });
  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.sendOtp = async (req, res) => {
  var { phone } = req.body;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  if (!phone) {
    return res.json({
      status: fail,
      message: "No phone no provided",
    });
  }

  let getUser = await User.findOne({
    where: { phone },
  });

  if (getUser) {
    return res.status(status.BAD_REQUEST).json({
      status: fail,
      message: phoneRegistered,
    });
  }

  try {
    const result = await client.verify
      .services(verifySid)
      .verifications.create({ to: phone, channel: "sms" });

    return res.status(200).json({
      status: success,
      message: otpSent,
      data: result.status,
    });
  } catch (error) {
    return res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  var { phone, code } = req.body;
  const client = require("twilio")(accountSid, authToken);

  try {
    const result = await client.verify
      .services(verifySid)
      .verificationChecks.create({ to: phone, code: code });

    if (result.status == "pending") {
      return res.status(400).json({
        status: fail,
        message: invalidOtp,
      });
    }

    return res.status(200).json({
      status: success,
      message: otpVerified,
      data: result.status,
    });
  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    // return res.json({
    //   hello: 'Hello world '
    // })
    var { phone, password, email, fcmToken } = req.body;

    if (!phone || !password) {
      throw ({
        message: 'Incomplete request'
      })
    }

    if (phone) {
      const result = phoneLogin(req.body);

      

      if (result.error != null) {
        return res.status(status.BAD_REQUEST).json({
          status: fail,
          message: result.error.details[0].message,
        });
      }



      var user = await User.findOne({
        where: { phone: phone }, 
        include: [
          {
            model: UserSetting,
            as: "userSetting",
          },
          {
            model: UserFcmToken,
            as: "fcmToken",
          },
        ],
      });

      // return res.status(200).json({
      //   user
      // })

      if (!user) {
        return res.status(status.NOT_FOUND).json({
          status: fail,
          message: UserNotFound,
        });
      }

      var passwordIsValid = await bcrypt.compare(password, user.password);

      if (!passwordIsValid) {
        return res.status(status.BAD_REQUEST).json({
          status: fail,
          message: InvalidCredentials,
        });
      }

      const getFcmToken = await UserFcmToken.findOne({
        where: {
          userId: user.id,
          fcmToken: fcmToken,
        },
      });

      if (!getFcmToken) {
        await UserFcmToken.create({
          userId: user.id,
          fcmToken: fcmToken,
          pushNotification: user.userSetting.pushNotification,
        });
      }

      var token = user.getJWTToken();

      return res.header({ authToken: token }).status(status.OK).json({
        status: success,
        user,
        accessToken: token,
      });
    }
    if (email) {
      const result = emailLogin(req.body);

      if (result.error != null) {
        return res.status(status.BAD_REQUEST).json({
          status: fail,
          message: result.error.details[0].message,
        });
      }

      var user = await User.findOne({
        where: {
          email,
        },
        include: [
          {
            model: UserPermission,
            as: "permissions",
            attributes: ["name"],
          },
        ],
      });

      if (!user) {
        return res.status(status.NOT_FOUND).json({
          status: fail,
          message: InvalidCredentials,
        });
      }

      var passwordIsValid = await bcrypt.compare(password, user.password);

      if (!passwordIsValid) {
        return res.status(status.BAD_REQUEST).json({
          status: fail,
          message: InvalidCredentials,
        });
      }

      var token = user.getJWTToken();

      let responseUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImg: user.profileImg,
        email: user.email,
        userType: user.userType,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        permissions: ["Dashboard"],
      };

      user.permissions.forEach((Element) => {
        responseUser.permissions.push(Element.name);
      });

      res.header({ authToken: token }).status(status.OK).json({
        status: success,
        user: responseUser,
        // user,
        accessToken: token,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  const client = require("twilio")(accountSid, authToken);

  const { phone } = req.body;

  const getUser = await User.findOne({
    where: {
      phone,
    },
  });

  if (!getUser) {
    return res.status(status.NOT_FOUND).json({
      status: fail,
      message: "Phone no doesn't exists",
    });
  }

  try {
    const result = await client.verify
      .services(verifySid)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return res.status(200).json({
      status: success,
      message: otpSent,
      data: result.status,
    });
  } catch (error) {
    return res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  const { email, password, token } = req.body;

  const hashedToken = User.createHashFromString(token);

  const user = await User.findOne({
    include: [
      {
        model: ForgotPasswordToken,
        where: {
          token: hashedToken,
          expiresIn: {
            [Op.gt]: Date.now(),
          },
        },
      },
    ],
  });

  if (!user) {
    return res.status(status.UNAUTHORIZED).json({
      status: fail,
      message: "Your session has been expired!",
    });
  }

  user.password = bcrypt.hashSync(password, 8);
  await user.ForgotPasswordToken.destroy();

  await user.save();

  return res.status(status.OK).json({
    status: success,
    message: "Pin code updated successfully",
  });
};

exports.logOut = async (req, res) => {
  try {
    const user_id = req.user.id;

    const getFcmToken = await UserFcmToken.destroy({
      where: {
        userId: user_id,
      },
    });

    return res.status(status.OK).json({
      status: success,
      message: "Log out",
    });
  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error,
    });
  }
};

exports.updatePassword = async (req, res) => {
  const { phone, password } = req.body;

  const getUser = await User.findOne({
    where: {
      phone,
    },
  });

  if (!getUser) {
    return res.status(status.NOT_FOUND).json({
      status: fail,
      message: "Phone no not exist",
    });
  }

  getUser.password = bcrypt.hashSync(password, 8);
  await getUser.save();

  return res.status(status.OK).json({
    status: success,
    message: "Password updated successfully..",
  });
};

exports.google = async (req, res) => {
  let { firstName, lastName, phone, googleId, fcmToken } = req.body;
  try {
    let user = await User.findOne({
      where: {
        googleId: googleId,
      },
    });
    if (!user) {
      await User.create({
        firstName,
        lastName,
        googleId,
        fcmToken,
        phone,
      });
      user = await User.findOne({
        where: {
          googleId: googleId,
        },
      });
    }
    let fcmTokenExists = await UserFcmToken.findOne({
      where: {
        userId: user.id,
        fcmToken: req.body.fcmToken,
      },
    });
    if (!fcmTokenExists) {
      await UserFcmToken.create({
        userId: user.id,
        fcmToken: req.body.fcmToken,
      });
    }
    let token = user.getJWTToken();
    res.status(200).send({
      status: "success",
      data: {
        user: user,
        accessToken: token,
      },
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.facebook = async (req, res) => {
  let { firstName, lastName, phone, facebookId, fcmToken } = req.body;
  try {
    let user = await User.findOne({
      where: {
        facebookId: facebookId,
      },
    });
    if (!user) {
      await User.create({
        firstName,
        lastName,
        phone,
        facebookId,
        fcmToken,
      });
      user = await User.findOne({
        where: {
          facebookId: facebookId,
        },
      });
    }
    let fcmTokenExists = await UserFcmToken.findOne({
      where: {
        userId: user.id,
        fcmToken: req.body.fcmToken,
      },
    });
    if (!fcmTokenExists) {
      await UserFcmToken.create({
        userId: user.id,
        fcmToken: req.body.fcmToken,
      });
    }
    let token = user.getJWTToken();
    res.status(200).send({
      status: "success",
      data: {
        user: user,
        accessToken: token,
      },
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.twitter = async (req, res) => {
  let { firstName, lastName, twitterId, phone, fcmToken } = req.body;
  try {
    let user = await User.findOne({
      where: {
        twitterId: twitterId,
      },
    });
    if (!user) {
      await User.create({
        firstName,
        lastName,
        twitterId,
        fcmToken,
        phone,
      });
      user = await User.findOne({
        where: {
          twitterId: twitterId,
        },
      });
    }
    let fcmTokenExists = await UserFcmToken.findOne({
      where: {
        userId: user.id,
        fcmToken: req.body.fcmToken,
      },
    });
    if (!fcmTokenExists) {
      await UserFcmToken.create({
        userId: user.id,
        fcmToken: req.body.fcmToken,
      });
    }
    let token = user.getJWTToken();
    res.status(200).send({
      status: "success",
      data: {
        user: user,
        accessToken: token,
      },
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.apple = async (req, res) => {
  let { firstName, lastName, appleId, fcmToken, phone } = req.body;
  try {
    let user = await User.findOne({
      where: {
        appleId: appleId,
      },
    });
    if (!user) {
      await User.create({
        firstName,
        lastName,
        appleId,
        fcmToken,
        phone,
      });
      user = await User.findOne({
        where: {
          appleId: appleId,
        },
      });
    }
    let fcmTokenExists = await UserFcmToken.findOne({
      where: {
        userId: user.id,
        fcmToken: req.body.fcmToken,
      },
    });
    if (!fcmTokenExists) {
      await UserFcmToken.create({
        userId: user.id,
        fcmToken: req.body.fcmToken,
      });
    }
    let token = user.getJWTToken();
    res.status(200).send({
      status: "success",
      data: {
        user: user,
        accessToken: token,
      },
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.socialLoginApi = async (req, res) => {
  let {
    socialLoginId,
    fromGoogle = false,
    fromFacebook = false,
    fromTwitter = false,
    fromApple = false,
  } = req.body;

  var user = await User.findOne({
    where: { socialLoginId, fromGoogle, fromFacebook, fromTwitter, fromApple },
    include: [
      {
        model: UserSetting,
        as: "userSetting",
      },
      {
        model: UserFcmToken,
        as: "fcmToken",
      },
    ],
  });

  if (!user) {
    return res.status(status.OK).json({
      status: fail,
      message: UserNotFound,
      user: null,
      isUser: false
    });
  } else {
    return res.status(status.OK).json({
      status: success,
      user,
      isUser: true
    });
  }
}