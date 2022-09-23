const User = require('./user.model');
const ForgotPasswordToken = require('./forgotPasswordToken.model');
const UserSetting = require('./userSetting.model')
const ContactList = require('./contactList.model')
const UserFcmToken = require('./userFcmToken.model')
const Notification = require('./notification.model')
const ReportedUser = require('./reportedUser.model')
const ChatBackup = require('./chatBackup.model')


require('./associations');

module.exports = {
    User,
    ForgotPasswordToken,
    UserSetting,
    ContactList,
    UserFcmToken,
    Notification,
    ReportedUser,
    ChatBackup
}

