const express = require("express");
const { authJwt } = require('../middlewares/authJwt')
const { backupMessages, chatBackupNewwww, index, getSingle, changeStatus, update, deleteUser, resetPassword, syncContactList, getContactList, updateProfileImg, userUpdate, settingsUpdate, blockContact, getContactDetails, media, deleteMessages, blockContactList, sendMessageNotification, reportUser, inviteFriend, chatBackup, generateRTCToken, chatBackupNew, generateRTMToken, updateUser } = require("../controllers/user.controller");
const { logOut } = require("../controllers/user.controller");
const { auth } = require("../middlewares/auth");
// const { upload } = require("../utils/multerFIle");
const { upload, uploadFile } = require("../utils/fileUpload");
const { UserFcmToken, User } = require("../models");

const userRouter = express.Router();

const nocache = (_, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}
// userRouter.get('/update-name', async (req, res, next) => {
//   res.json({
//     res: await User.findAndCountAll({
//       where: {
//         id: 63
//       }
//     })
//   })
// }) 
userRouter.route("/fcmtokens/:userId?").get(async (req, res, next) => {
  const userId = req.params.userId
  const options = {}
  if(userId) {
    return res.json({
      tokens: await UserFcmToken.findAll({
        where: {
          userId: userId
        },
        order: [
          ['id', 'DESC']
        ]
      })
    })
  }
  res.json({
    fcmTokens: await UserFcmToken.findAll(options)
  })
})



// userRouter.use(authJwt);
//Token will be check here using middleware named 'authJwt' before executing code of following route methods
// userRouter.route("/chat-backupp").get(chatBackupNew);
userRouter.route("/contacts").post(auth, getContactList);
userRouter.route("/contact-details/:id").get(auth, getContactDetails);
userRouter.route("/logout").post(auth, logOut);
// userRouter.route("/update").post(updateUser);
userRouter.route("/profile-update").post(upload.single('profileImg'), auth, updateProfileImg);
userRouter.route("/user-update").post(upload.single('profileImg'), auth, userUpdate);
userRouter.route("/setting-update").put(auth, settingsUpdate);
userRouter.route("/reset-password").post(resetPassword);
userRouter.route("/sync-contacts").post(auth, syncContactList);
userRouter.route("/delete-user").delete(auth, deleteUser);
userRouter.route("/block-contact").post(auth, blockContact);
userRouter.route("/rtm").get(nocache, generateRTMToken)

userRouter.route("/media").post(uploadFile.array('mediaFile', 10), media);

userRouter.route("/block-contact-list").get(auth, blockContactList);
userRouter.route("/send-message-notification").post(auth, sendMessageNotification);

userRouter.route("/reportuser").post(auth, reportUser);
userRouter.route("/invitefriend").post(auth, inviteFriend);
// userRouter.route("/chat-backup").get(chatBackup);
userRouter.route("/agora-token/:channel/:role/:tokentype/:uid/:calltype/:callerId").get(nocache, generateRTCToken)
// userRouter.route("/chat-backup-newwww").get(chatBackupNewwww);
userRouter.route("/backupMessages").get(backupMessages);




userRouter.route("/").get(index);
userRouter.route("/:id").get(getSingle);
userRouter.route("/update/:id").post(update);
userRouter.route("/changeStatus/:id").get(changeStatus);


module.exports = userRouter;
