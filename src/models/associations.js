const User = require('./user.model');
const ForgotPasswordToken = require('./forgotPasswordToken.model');
const UserSetting = require('./userSetting.model');
const ContactList = require('./contactList.model');
const UserPermission = require('./userpermission.model');
const Permission = require('./permission.model');
const UserFcmToken = require('./userFcmToken.model');
const ChatBackup = require('./chatBackup.model');
const UserWalletInfo = require('./userWalletInfo.model');

User.hasOne(ForgotPasswordToken, {
    onDelete: 'CASCADE',
    foreignKey: 'userId',
});

User.hasOne(ChatBackup, {
  onDelete: 'CASCADE',
  foreignKey: 'userId',
});
User.hasOne(UserSetting, {
    onDelete: 'CASCADE',
    as: 'userSetting',
    foreignKey: 'userId',
  })

User.belongsToMany(User, {
  onDelete: 'CASCADE',
  through: ContactList,
  as: 'contacts',
  foreignKey: 'contactOf',
  otherKey: 'contact'
  })

User.hasOne(UserWalletInfo, {
  onDelete: 'CASCADE',
  foreignKey: 'userId',
  as: 'walletInfo'
})
UserWalletInfo.belongsTo(User, {
  onDelete: 'CASCADE',
  foreignKey: 'userId',
  as: 'user',
})
  
UserSetting.belongsTo(User, {
    onDelete: 'CASCADE',
    as: 'user',
    foreignKey: 'userId',
  })

ContactList.belongsTo(User, {
    onDelete: 'CASCADE',
    as: 'contactList',
    foreignKey: 'contact',
  });
  User.hasMany(ContactList, {
    onDelete: 'CASCADE',
    as: 'userContactList',
    foreignKey: 'contactOf',
  });

User.belongsToMany(Permission, {
  onDelete: 'CASCADE',
  through: UserPermission,
  as: 'permission',
  foreignKey: 'userId',
  // otherKey: 'property_id'
  })

Permission.belongsToMany(User, {
  onDelete: 'CASCADE',
  through: UserPermission,
  as: 'user',
  foreignKey: 'permissionId',
  // otherKey: 'property_id'
  })

UserPermission.belongsTo(Permission, {
  onDelete: 'CASCADE',
  as: 'permission',
  foreignKey: 'permissionId',
  // otherKey: 'property_id'
})

User.hasMany(UserPermission, {
  onDelete: 'CASCADE',
  as: 'permissions',
  foreignKey: 'userId',
  // otherKey: 'property_id'
  })

User.hasMany(UserFcmToken, {
  onDelete: 'CASCADE',
  as:'fcmToken',
  foreignKey:'userId'
})

UserFcmToken.belongsTo(User,{
  onDelete: 'CASCADE',
  as: 'userFcmToken',
  foreignKey: 'userId',
})

