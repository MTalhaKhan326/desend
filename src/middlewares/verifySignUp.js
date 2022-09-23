
const User = require('../models/user.model');
const { phoneRegistered, emailRegistered, phoneRequired } = require('../utils/Error');

exports.checkPhoneNoAccount = async (req, res, next) => {
  var { phone } = req.body;
  if (!phone) {
    return res.status(400).json({
      message: phoneRequired
    });

  }
  var user = await User.findOne({
    where: {
      phone
    }
  })
  if (user) {
    return res.status(400).json({
      message: phoneRegistered
    });
  }
  else {
    next()
  }
};

exports.checkMail = async (req, res, next) => {
  var { email } = req.body;
  var user = await User.findOne({
    where: {
      email
    }
  })
  if (user) {
    return res.status(400).json({
      message: emailRegistered
    });
  }
  else {
    next()
  }
};
