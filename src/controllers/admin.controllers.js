const User = require("../models/user.model");
const Sequelize = require('sequelize');
const { ContactList, UserSetting, UserFcmToken, Notification } = require("../models");
const { Op, where } = require("sequelize");
const status = require('http-status');
const { resetPassword, syncContact } = require("../validations/users");
const { InvalidCredentials, UserNotFound, fail, success, ContactNotFound, NoUserExist, NoAdminExist, NoPermissionExist, userStatus, userType, adminUnblocked, adminBlocked, adminDelete, deleted, permissionRequired, userBlocked, userUnblocked, adminUpdated, adminAdded, notificationSend, notificatioDeleted } = require("../utils/Error");
const UserPermission = require("../models/userpermission.model");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/db.config");
const Permission = require("../models/permission.model");
const { admin } = require("../firebase/firebase-config");
var moment = require('moment');

exports.addAdmin = async (req, res, next) => {
  try {
    transaction = await sequelize.transaction();

    let { firstName, lastName, phone, email, password } = req.body;
    password = bcrypt.hashSync(password, 8);

    const userAlreadyExists = await User.findOne({
      where: {
        email
      }
    });

    if (userAlreadyExists) {
      return res.json({
        status: fail,
        message: "Email already Registered",
      });
    } else {
      const user = await User.create({
        firstName,
        lastName,
        phone,
        email,
        password,
        userType: 'sub admin'
      }, { transaction });

      let permissions = req.body.permissions//array of permissions

      counter = 0
      newPermissions = []
      var totalPermissions = permissions.length

      if (permissions.length > 1) {
        permissions.map(async (permission) => {
          var addPermissions = {
            userId: user.id,
            permissionId: permission.id,
            name: permission.name
          }
          newPermissions.push(addPermissions)
          counter++
        })

        if (counter == totalPermissions) {
          var addedpermission = await UserPermission.bulkCreate(newPermissions,
            { transaction })
          await transaction.commit();

          return res.json({
            status: success,
            message: adminAdded,
            addedpermission,
            user
          })
        }

      }
      var addedpermission =
        await UserPermission
          .create({
            userId: user.id,
            permissionId: permissions[0].id,
            name: permissions[0].name
          },
            { transaction });

      await transaction.commit();

      return res.json({
        status: success,
        message: adminAdded,
        addedpermission,
        user
      })
    }

  }
  catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error
    })
  }
}
exports.getAllPermissions = async (req, res) => {
  try {
    const getPermissions = await Permission.findAll();

    if (getPermissions.length < 1) {
      return res.status(status.NOT_FOUND).json({
        status: fail,
        message: NoPermissionExist
      });
    }

    return res.status(status.OK).json({
      status: success,
      permissions: getPermissions
    });
  }
  catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    });
  }
}
exports.getAllAdmins = async (req, res) => {
  try {
    let { page, limit } = req.query
    offset = (page - 1) * limit

    const totalAdmins = await User.count(
      {
        where: { userType: userType.subAdmin },
      });

    const getAdmins = await User.findAll(
      {
        where: {
          userType: userType.subAdmin,
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${req.query.search}%` } },
            { lastName: { [Op.iLike]: `%${req.query.search}%` } },
            { phone: { [Op.iLike]: `%${req.query.search}%` } }
          ]
        },
        include: [{
          model: Permission,
          as: 'permission',
          // attributes: {exclude: ['UserPermission','id']}
        }],
        // attributes: ['id','firstName', 'lastName', 'phone', 'userType','status'],
        order: [
          ['id', 'DESC'],
        ],
        offset,
        limit: limit
      });
    if (getAdmins.length < 1) {
      return res.status(status.OK).json({
        status: fail,
        message: NoAdminExist
      });
    }
    return res.status(status.OK).json({
      status: success,
      admins: getAdmins,
      totalAdmins
    });
  }
  catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error
    });
  }
}
exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, search: name } = req.query
    offset = (page - 1) * limit
    const totalUsers = await User.count(
      {
        where: { userType: userType.user },
      });
    let whereClause = {};
    var stringArray = null
    if (hasWhiteSpace(name)) {
      stringArray = name.split(/(\s+)/);
    }
    if (name == 'with out name'){ name = 'with'}
    if (name == 'with out'){ name = 'with'}

    if (name && name !== null) {
      if (hasWhiteSpace(name)) {
        whereClause = {
          [Op.or]: [
            {
              firstName: {
                [Op.in]: stringArray,
              },
            },
            {
              lastName: {
                [Op.in]: stringArray,
              },
            },
            {
              phone: {
                [Op.in]: stringArray,
              },
            },
          ]
        }
      } else {
        whereClause = {
          [Op.or]: [
            {
              firstName: {
                [Op.like]: "%" + name + "%",
              },
            },
            {
              lastName: {
                [Op.like]: "%" + name + "%",
              },
            },
            {
              phone: {
                [Op.like]: "%" + name + "%",
              },
            },
          ]
        }
      }
    }
    whereClause.userType = userType.user;
    const getUsers = await User.findAll(
      {
        where: whereClause,
        attributes: ['id', 'firstName', 'lastName', 'phone', 'userType', 'status'],
        order: [
          ['id', 'ASC'],
        ],
        offset,
        limit: limit
      });
    if (getUsers.length < 1) {
      return res.status(status.OK).json({
        status: fail,
        message: NoUserExist
      });
    }
    return res.status(status.OK).json({
      status: success,
      users: getUsers,
      totalUsers
    });
  }
  catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    });
  }
}
exports.blockAdmin = async (req, res) => {
  let { adminId } = req.body;
  try {
    let getAdmin = await User.findOne({
      where: { id: adminId }
    })

    if (!getAdmin) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: UserNotFound,
      })
    }

    if (getAdmin.status == null || getAdmin.status == userStatus.active) {
      await getAdmin.update({ status: userStatus.blocked })
      await getAdmin.save();

      return res.status(status.OK).json({
        status: success,
        message: adminBlocked,
        getAdmin,
      })
    }

    if (getAdmin.status == userStatus.blocked) {
      await getAdmin.update({ status: userStatus.active })
      await getAdmin.save()

      return res.status(status.OK).json({
        status: success,
        message: adminUnblocked,
        getAdmin,
      })
    }
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    })
  }
}
exports.deleteAdmin = async (req, res) => {
  let { adminId } = req.params;
  try {
    let getAdmin = await User.findOne({
      where: { id: adminId }
    });

    if (!getAdmin) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: UserNotFound,
      })
    }

    if (getAdmin.userType == userType.admin) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: adminDelete,
      })
    }

    if (getAdmin.userType == userType.subAdmin) {
      await getAdmin.destroy()
      return res.status(status.OK).json({
        status: deleted,
        message: "Sub-Admin deleted successfully"
      });
    }

  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    })
  }
}
exports.updateAdmin = async (req, res) => {
  try {
    transaction = await sequelize.transaction();
    let { firstName,
      lastName,
      phone,
      email,
      password,
      permissions,
      adminId
    } = req.body;

    password = bcrypt.hashSync(password, 8);

    UserPermission.destroy({
      where: { userId: adminId }
    }, { transaction });

    // await transaction.commit(); 
    let getAdmin = await User.findOne({
      where: { id: adminId }
    }, { transaction });

    if (!getAdmin) {
      await transaction.rollback();
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: UserNotFound,
      })
    }

    if (getAdmin) {
      await getAdmin.update(
        { firstName, lastName, phone, email, password },
        { transaction }
      )

      // await transaction.commit();
      await getAdmin.save()
      counter = 0
      newPermissions = []

      var totalPermissions = permissions.length;
      if (permissions.length > 1) {
        permissions.map(async (permission) => {

          var addPermissions = {
            userId: getAdmin.id,
            permissionId: permission.id,
            name: permission.name
          }

          newPermissions.push(addPermissions)
          counter++
        })

        if (counter == totalPermissions) {
          var addedpermission = await UserPermission.bulkCreate(newPermissions,
            { transaction }
          )

          await transaction.commit();
          return res.json({
            status: success,
            message: adminUpdated,
            addedpermission,
            user: getAdmin
          })
        }
      }

      if (!permissions || permissions.length < 1) {
        await transaction.rollback();
        return res.status(status.BAD_REQUEST).json({
          status: fail,
          message: permissionRequired,
        })
      }

      var addedpermission = await UserPermission.create({
        userId: getAdmin.id,
        permissionId: permissions[0].id,
        name: permissions[0].name
      },
        { transaction }
      )

      await transaction.commit();

      return res.json({
        status: success,
        message: adminUpdated,
        addedpermission,
        user: getAdmin
      })
    }
  }
  catch (error) {

    if (transaction) {
      await transaction.rollback();
    }

    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error.message
    })
  }
}


exports.blockUser = async (req, res) => {
  let { userId } = req.body;
  try {
    let getUser = await User.findOne({
      where: { id: userId }
    });

    if (!getUser) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: UserNotFound,
      })
    }

    if (getUser.status == null || getUser.status == userStatus.active) {

      await getUser.update({ status: userStatus.blocked });
      await getUser.save();

      return res.status(status.OK).json({
        status: success,
        message: userBlocked,
        getUser,
      })
    }
    if (getUser.status == userStatus.blocked) {

      await getUser.update({ status: userStatus.active });
      await getUser.save();

      return res.status(status.OK).json({
        status: success,
        message: userUnblocked,
        getUser,
      })
    }
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    })
  }
}
exports.sendNotification = async (req, res) => {

  const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

  const { title, notification } = req.body
  const createNewNotification = await Notification.create({ title, notification });

  const payload = {
    'notification': {
      'title': title,
      'body': notification,
    },
  };

  const getTokens = await UserFcmToken.findAll(
    {
      where: {
        pushNotification: true
      }
    },
    { attributes: ['fcmToken'] }
  );

  tokensArray = []
  if (getTokens.length < 1) {
    return res.status(200).json
      ({
        status: fail,
        message: "No device exist for notification"
      })
  }

  getTokens.map(token => {
    let = tokensArray.push(token.fcmToken)
  });

  const options = notification_options;

  admin
    .messaging()
    .sendToDevice(tokensArray, payload, options)
    .then(response => {
      return res.status(200).json({
        status: success,
        message: notificationSend,
        response
      })
    })
    .catch(error => {
      console.log(error);
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        status: fail,
        error: error.message
      })
    });

}
exports.getAllNotification = async (req, res) => {
  try {
    let { page, limit, search } = req.query
    offset = (page - 1) * limit
    const totalNotification = await Notification.count();

    const getNotification = await Notification.findAll(
      {
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { notification: { [Op.iLike]: `%${search}%` } }
          ]
        },
        order: [
          ['id', 'ASC'],
        ],
        offset,
        limit: limit
      });

    if (getNotification.length < 1) {
      return res.status(status.OK).json({
        status: fail,
        message: "No notification",
        totalNotification
      });
    }

    return res.status(status.OK).json({
      status: success,
      users: getNotification,
      totalNotification
    });
  }
  catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    });
  }
}
exports.deleteNotification = async (req, res) => {
  let { notificationId } = req.params;

  try {
    let getNotification = await Notification.findOne({
      where: { id: notificationId }
    });

    if (!getNotification) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: notificatioDeleted,
      })
    }

    if (getNotification) {
      await getNotification.destroy()
      return res.status(status.OK).json({
        status: deleted
      });
    }

  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    })
  }
}


exports.usersDetailDashboard = async (req, res) => {
  try {
    // const {date}=req.body
    let startDate = Date.now()
    let endDate = moment(startDate).subtract(1, 'years').utc();

    console.log("starts datae, end date", startDate, endDate)
    //   startdate.subtract(1, "days");
    // startdate = startdate.format("DD-MM-YYYY");

    var Activitydata = [
      { name: "Jan", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Feb", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Mar", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Apr", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "May", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Jun", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Jul", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Aug", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Sep", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Oct", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Nov", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
      { name: "Dec", DeactiveUsers: 0, Admin: 0, TotalUsers: 0 },
    ];

    totalAdmins = 0;
    totalUsers = 0;
    totalDeactiveUsers = 0;


    const getUsers = await User.findAll({
      where: {
        createdAt: {
          [Op.between]: [endDate, startDate],
        },
      }
    });

    if (getUsers.length < 1) {
      return res.status(status.OK).json({
        status: success,
        Activitydata,
        totalAdmins,
        totalUsers,
        totalDeactiveUsers,
      });
    }

    for (let i = 0; i < getUsers.length; i++) {

      if (getUsers[i].userType == "user") {
        let month = moment(getUsers[i].createdAt, 'YYYY/MM/DD').month();
        Activitydata[month].TotalUsers++
        totalUsers++
      }

      if (getUsers[i].userType == "sub admin") {
        let month = moment(getUsers[i].createdAt, 'YYYY/MM/DD').month();
        Activitydata[month].Admin++
        totalAdmins++
      }

      if (getUsers[i].userType == "user" && getUsers[i].status == "blocked") {
        let month = moment(getUsers[i].createdAt, 'YYYY/MM/DD').month();
        Activitydata[month].DeactiveUsers++
        totalDeactiveUsers++
      }

    }

    return res.status(status.OK).json({
      status: success,
      Activitydata,
      totalAdmins,
      totalUsers,
      totalDeactiveUsers,
    });

  }
  catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message
    });
  }
}



function hasWhiteSpace(s) {
  return (/\s/).test(s);
}
