const { User } = require("../models");
const status = require('http-status');
const UserPermission = require("../models/userpermission.model");
const sequelize = require("../config/db.config");
const { fail, NoRouteAccess, userType } = require("../utils/Error");

exports.userPermission = async (req, res, next) => {
    const getAdmin = await User.findOne(
        {
            where: { id: req.user.id }
        });
    if (getAdmin.userType == userType.user || !getAdmin.userType) {
        return res.status(status.UNAUTHORIZED).json
            ({
                status: fail,
                message: NoRouteAccess
            });
    }

    var userPermissionAccess = false;
    
    if (getAdmin.userType == userType.subAdmin) {
        let getPermissions = await UserPermission.findAll(
            {
                where: { userId: req.user.id }
            })
        getPermissions.map(permission => {
            if (permission.permissionId == 1) {
                userPermissionAccess = true
            }
        })
        if (userPermissionAccess != true) {
            return res.status(status.UNAUTHORIZED).json
                ({
                    status: fail,
                    message: NoRouteAccess
                })
        }
    }
    next()
}

exports.adminPermission = async (req, res, next) => {
    const getAdmin = await User.findOne(
        {
            where: { id: req.user.id }
        });
    if (getAdmin.userType == userType.user || !getAdmin.userType) {
        return res.status(status.UNAUTHORIZED).json
            ({
                status: 0,
                message: NoRouteAccess
            });
    }
    var adminPermissionAccess = false;
    if (getAdmin.userType == userType.subAdmin) {
        let getPermissions = await UserPermission.findAll(
            {
                where: { userId: req.user.id }
            })
        getPermissions.map(permission => {
            if (permission.permissionId == 2) {
                adminPermissionAccess = true
            }
        })
        if (adminPermissionAccess != true) {
            return res.status(status.UNAUTHORIZED).json
                ({
                    status: fail,
                    message: NoRouteAccess
                })
        }
    }
    next()
}



exports.notificationPermission = async (req, res, next) => {
    const getAdmin = await User.findOne(
        {
            where: { id: req.user.id }
        });

    if (getAdmin.userType == userType.user || !getAdmin.userType) {
        return res.status(status.UNAUTHORIZED).json
            ({
                status: 0,
                message: NoRouteAccess
            });
    }

    var notificationPermissionAccess = false;

    if (getAdmin.userType == userType.subAdmin) {

        let getPermissions = await UserPermission.findAll(
            {
                where: { userId: req.user.id }
            })

        getPermissions.map(permission => {
            if (permission.permissionId == 3) {
                notificationPermissionAccess = true
            }
        })

        if (notificationPermissionAccess != true) {
            return res.status(status.UNAUTHORIZED).json
                ({
                    status: fail,
                    message: NoRouteAccess
                })
        }

    }
    next()
}
