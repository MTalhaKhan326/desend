const authRoutes = require("./auth.routes");
const userRoutes = require('./user.routes')
const adminRoutes = require('./admin.routes')
const twilioRoutes = require('./twilio.routes')
const walletRoutes = require('./wallet.routes')

module.exports = {
  authRoutes,
  userRoutes,
  adminRoutes,
  twilioRoutes,
  walletRoutes
};
