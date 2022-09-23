const express = require("express");
const { authJwt } = require('../middlewares/authJwt')
const { getTokens } = require("../controllers/twilio.controller");
const { auth } = require("../middlewares/auth");
// const { upload } = require("../utils/multerFIle");
const { upload, uploadFile } = require("../utils/fileUpload");

const twilioRouter = express.Router();

twilioRouter.get('/getToken', getTokens);

module.exports = twilioRouter;
