const express = require("express");
const { getAllUsers, addAdmin, getAllPermissions, getAllAdmins, blockAdmin, deleteAdmin, searchAdmin, updateAdmin, blockUser, sendNotification, getAllNotification, deleteNotification, usersDetailDashboard } = require("../controllers/admin.controllers");
const { auth } = require("../middlewares/auth");
const { userPermission, adminPermission, notificationPermission } = require("../middlewares/permissions");
const { checkMail, checkPhoneNoAccount } = require("../middlewares/verifySignUp");
const { uploadFile } = require("../utils/fileUpload");
const { upload } = require("../utils/multerFIle");

const adminRouter = express.Router();

//=======Permissions=======//
adminRouter.route("/all-users").get( getAllUsers);//check admin login and have permision for this route
adminRouter.route("/all-permissions").get(getAllPermissions);

//=======Admin Managment=======//

adminRouter.route("/add-admin").post(checkPhoneNoAccount, checkMail, addAdmin);
adminRouter.route("/all-admins").get(auth, adminPermission, getAllAdmins);
adminRouter.route("/block-admin").post(auth, adminPermission, blockAdmin);
adminRouter.route("/delete-admin/:adminId").delete(auth, adminPermission, deleteAdmin);
adminRouter.route("/update-admin").put(auth, adminPermission, updateAdmin);

//=======User Managment=======//

adminRouter.route("/block-user").post(auth, adminPermission, blockUser);

//=======Notification Managment=======//

adminRouter.route("/all-notification").get(auth, notificationPermission, getAllNotification);//check admin login and have permision for this route
adminRouter.route("/send-notification").post(auth, notificationPermission, sendNotification);
adminRouter.route("/delete-notification/:notificationId").delete(auth, notificationPermission, deleteNotification);

//=======Dashboard Managment=======//

adminRouter.route("/users-detail-dashboard").get(auth, userPermission, usersDetailDashboard);





module.exports = adminRouter;
