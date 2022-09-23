const passport = require('passport');
const APIError = require("../utils/APIError.js");
const status = require('http-status')
exports.authJwt = (req, res, next) => {

  passport.authenticate(
    'jwt',
    { session: false },

    function (err, user, info) {
      if (info)
        return next(new APIError(info.message, status.BAD_REQUEST))
      req.user = user
      next()
    }

  )(req, res, next)
};
