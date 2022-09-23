const express = require("express");
const { upload } = require("../utils/fileUpload");
const { checkPhoneNoAccount } = require("../middlewares/verifySignUp");
const { login, phoneRegistration, forgotPassword, resetPassword, sendOtp, verifyOtp, logOut, updatePassword, socialLoginApi } = require("../controllers/auth.controller");
const { auth } = require("../middlewares/auth");

const authRouter = express.Router();
authRouter.route("/phoneno-registraion").post(upload.single('profileImg'), checkPhoneNoAccount, phoneRegistration);
authRouter.route("/login").post(login);
authRouter.route('/forgot-password').post(forgotPassword);
authRouter.route('/reset-password').post((resetPassword));
authRouter.route('/sendOtp').post((sendOtp));
authRouter.route('/verify-otp').post((verifyOtp));
authRouter.route('/update-Password').post((updatePassword));
authRouter.route("/social-login/check").post(socialLoginApi);

module.exports = authRouter;