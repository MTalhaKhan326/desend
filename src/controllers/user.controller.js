const User = require("../models/user.model");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const {
  ContactList,
  UserSetting,
  UserFcmToken,
  Notification,
  ChatBackup
} = require("../models");
const { Op } = require("sequelize");
const status = require("http-status");
const { resetPassword, syncContact } = require("../validations/users");
const {
  InvalidCredentials,
  UserNotFound,
  fail,
  success,
  ContactNotFound,
  PasswordReset,
  ImageUpdated,
  SettingUpdated,
  UserBlocked,
  UserUnblocked,
  userStatus,
  fileRequired,
  imageUrl,
  UserUpdated,
  notificationSend,
} = require("../utils/Error");
var { sampleUser } = require("../utils/Error");
const { phone } = require("phone");
var moment = require("moment");
const { db, admin } = require("../firebase/firebase-config");
const ReportedUser = require("../models/reportedUser.model");
const {
  upload,
  uploadFileToSSS,
  uploadToS3,
  uploadThumbnailToS3,
} = require("../utils/fileUpload");
const Thumbler = require("thumbler");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_SERVICE_SID;
const { backup, backupFromDoc } = require('firestore-export-import')
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token');
const console = require("console");
var FCM = require('fcm-node');



exports.generateRTCToken = async (req, resp, next) => {
  // return resp.send({
  //   hello: "world"
  // })
  //set the response header
  try {
    resp.header('Access-Control-Allow-Origin', '*');
    //get the channel name
    const channelName = req.params.channel;
    let callType = req.params.calltype
    if (!channelName) {
      return resp.status(500).json({ 'error': 'channel is required' });
    }
    if (!callType || !['audioCall', 'videoCall'].includes(callType)) {
      callType = 'audioCall'
    }
    let isGroupCall = req.params.isGroupCall
    if(isGroupCall && isGroupCall === 'groupCall') {
      isGroupCall = true
    } else {
      isGroupCall = false
    }

    //get uid
    let uid = req.params.uid;
    if(!uid || uid === '') {
        return resp.status(500).json({ 'error': 'uid is required' });
    }
    let callerId = req.params.callerId
    let caller = await User.findByPk(callerId)
    // get role
    let role;
    if (req.params.role === 'publisher') {
        role = RtcRole.PUBLISHER;
    } else if (req.params.role === 'audience') {
        role = RtcRole.SUBSCRIBER
    } else {
        return resp.status(500).json({ 'error': 'role is incorrect' });
    }
    //get expire time
    let expireTime = req.query.expiry;
    if (!expireTime || expireTime === '') {
      expireTime = 3600;
    } else {
      expireTime = parseInt(expireTime, 10);
    }
    //calculate the privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    //build the Token
    let token;
    const APP_ID=process.env.AGORA_APPLE_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    if (req.params.tokentype === 'userAccount') {
      token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, 0, role, privilegeExpireTime);
    } else if (req.params.tokentype === 'uid') {
      token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, 0, role, privilegeExpireTime);
      // return resp.json({success: true, token}) 
    } else {
      return resp.status(500).json({ 'error': 'token type is invalid' });
    }

    // get user by uid

    let fcmTokenRow = await UserFcmToken.findOne({
      where: {
        userId: uid
      },
      order: [
        ['id', 'DESC']
      ]
    })
    if(!fcmTokenRow || !fcmTokenRow.fcmToken) {
      return resp.status(500).json({
        error: 'Fcm Token not found',
        uid,
        fcmTokenRow
        
      })
    }

    const user = await User.findByPk(uid)

    // fcmTokenRow = {fcmToken: "dvQINutAS4az5_h1u0_EqG:APA91bFll9TgNSBuHoXuyNxadAtHOKlyJO6IMKoQ_QiFs-fQOSN42KP0_2qC9LkobU1eXshf2-CMztX-ZcyuMsQkbc0TuD2ImTnyLdWjitnQRePcKTTcIIrJHIkgZM0dnfYdpZnn6wyl"}

    const { fcmToken } = fcmTokenRow

    var serverKey = "AAAA0ji_iG4:APA91bHgMuW__4Gy68Qa9HR6SZ39wZD_sCDV-RMVfTDhB7ru4Vom-sQBr1eLhDHGVbupXAMs0GcHJX3qAHgfbiW5JaysHYfZobO7BVfK2HDeRtTGEII3cvgW0JbKUNq-T0sXtni4qmDC"; //put your server key here 
    var fcm = new FCM(serverKey);
    var message = { // this may vary according to the message type (single recipient, multicast, topic, et cetera)
      to: fcmToken, 
      // notification: {
      //   title: 'Accept call?', 
      //   body: 'Click Accept to accept the call!',
      //   android: {
      //     channelId: "some_1",
      //   }
      // },
      data: {
        agoraToken: token,
        channelName: channelName,
        callType: callType,
        caller: caller,
        callee: user,
        isGroupCall
      }
    };
  
    fcm.send(message, function(err, response) {
      if(err) {
        console.log('error in fcm')
        console.log(err)
      } else {
        console.log('*****************************sent successfully')
        console.log(response.results)
      }
    }) 

    //return the token
    return resp.json({ 'rtcToken': token });
  } catch(e) {
    return resp.json({
      'error': e
    })
  }
};

exports.index = async (req, res) => {
  try {
    const options = {
      attributes: [
        "id",
        "email",
        "phone",
        "country",
        "isActive",
        [
          Sequelize.fn(
            "concat",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "name",
        ],
      ],

      offset: (req.query.page - 1) * 5,
      limit: 5,
      order: [["id", "DESC"]],

      where: {
        role: 1,
      },
    };

    const users = await User.findAndCountAll(options);

    res.status(status.OK).send({
      status: "success",
      data: {
        users: users.rows,
        pages: Math.ceil(users.count / 5),
      },
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).send({ message: error.message });
  }
};
exports.getSingle = async (req, res) => {
  try {
    const user = await User.findOne({
      attributes: [
        "id",
        "email",
        "phone",
        // "city",
        // "country",
        // "isActive",
        "firstName",
        "lastName",
        // "gender",
        // "age",
        // "dob",

        [
          Sequelize.fn(
            "concat",
            Sequelize.col("firstName"),
            " ",
            Sequelize.col("lastName")
          ),
          "name",
        ],
      ],

      where: {
        id: req.params.id,
      },
    });

    res.status(status.OK).send({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).send({ message: error.message });
  }
};
exports.changeStatus = async (req, res) => {
  try {
    let user = await User.findByPk(req.params.id);

    if (user.isActive) {
      await User.update(
        {
          isActive: 0,
        },
        { where: { id: req.params.id } }
      );
    } else {
      await User.update(
        {
          isActive: 1,
        },
        { where: { id: req.params.id } }
      );
    }

    user = await User.findOne({
      where: {
        id: req.params.id,
      },
    });

    res.status(status.OK).send({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).send({ message: error.message });
  }
};
exports.update = async (req, res) => {
  const { firstName, lastName, email, phone, country, city, gender, dob, age } =
    req.body;

  try {
    await User.update(
      {
        firstName,
        lastName,
        email,
        phone,
        country,
        city,
        gender,
        dob,
        age,
      },
      { where: { id: req.params.id } }
    );

    const user = await User.findOne({
      where: {
        id: req.params.id,
      },
    });

    res.status(status.OK).send({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).send({ message: error.message });
  }
};
exports.syncContactList = async (req, res, next) => {
  try {
    const result = syncContact(req.body);
    const user_id = req.user.id;
    let { contacts } = req.body;

    let filterContacts = [];
    newcontacts = [];

    var users = await User.findAll({
      where: {
        phone: filterContacts,
      },
    });

    var totalUsers = users.length;
    counter = 0;

    if (result.error != null) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: result.error.details[0].message,
      });
    }

    contacts.map((contact) => {
      let getCode = contact.substring(0, 2);
      if (contact.length == 11 && getCode == "03") {
        contact = setCharAt(contact, 0, "+92");
      }

      const getphone = phone(contact, { country: null });
      if (getphone.isValid == true) {
        filterContacts.push(getphone.phoneNumber);
      }
    });



    if (users.length == 0) {
      return res.json({
        status: success,
        message: "No new contact found",
      });
    }

    await Promise.all(
      users.map(async (user) => {
        await ContactList.findOne({
          where: {
            contactOf: user_id,
            contact: user.id,
          },
        })
          .then((findContact) => {
            if (findContact == null) {
              if (user_id != user.id) {
                var contactlist = { contactOf: user_id, contact: user.id };
                newcontacts.push(contactlist);
              }
            }
          })
          .catch();
        counter++;
      })
    );

    if (counter == totalUsers) {
      var syncedContacts = await ContactList.bulkCreate(newcontacts);
      return res.json({
        status: success,
        syncedContacts,
      });
    }
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error.message,
    });
  }
};

function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;

  return str.substring(0, index) + chr + str.substring(index + 1);
}

exports.getContactList = async (req, res) => {
  try {
    newcounter = 0;
    let { contacts } = req.body;
    counter = 0;
    var users = [];

    // let {page}=req.query
    //  contacts=contacts.slice(((page-1)*limit),(page*limit));

    contacts.map((contact) => {
      contact.phoneNumbers.map((number) => {
        newcounter++;
      });
    });

    await Promise.all(
      contacts.map(async (contact) => {
        userPhoneNumbers = contact.phoneNumbers;

        await Promise.all(
          userPhoneNumbers.map(async (contactNumber) => {
            let getCode = contactNumber.number.substring(0, 2);

            if (contactNumber.number.length == 11 && getCode == "03") {
              contactNumber.number = setCharAt(contactNumber.number, 0, "+92");
            }

            const getphone = phone(contactNumber.number, { country: null });

            if (getphone.isValid == true) {
              findContact = getphone.phoneNumber;
            } else {
              findContact = contactNumber.number;
            }

            await User.findOne({
              where: {
                phone: findContact,
              },
            }).then(async (user) => {
              if (user && user.id == req.user.id) {
                counter++;
              }

              if (user && user.id != req.user.id) {
                await ContactList.findOne({
                  where: {
                    contact: user.id,
                    contactOf: req.user.id,
                  },
                }).then(async (getcontactstatus) => {
                  if (getcontactstatus) {
                    user.dataValues.isregister = true;
                    user.dataValues.contactStatus = getcontactstatus.status;
                    users.unshift(user);
                    counter++;
                  } else {
                    await ContactList.create({
                      contact: user.id,
                      contactOf: req.user.id
                    })
                    user.dataValues.isregister = true;
                    user.dataValues.contactStatus = 'unblocked';
                    users.unshift(user);
                    counter++;
                  }
                });
              }

              if (!user) {
                var notRegistered = {
                  id: null,
                  firstName: contact.givenName,
                  lastName: contact.familyName,
                  phone: contactNumber.number,
                  createdAt: null,
                  profileImg: "",
                  isregister: false,
                };
                users.push(notRegistered);
                counter++;
              }
            });

            if (counter == newcounter) {
              const arr = users;

              const ids = arr.map((o) => o.phone);
              const filtered = arr.filter(
                ({ phone }, index) => !ids.includes(phone, index + 1)
              );

              return res.json({
                status: success,
                users: filtered,
                hello: 'deployed'
              });
            }
          })
        );
      })
    );
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message,
      hello: 'error'
    });
  }
};
exports.getContactDetails = async (req, res) => {
  try {
    const contact = await User.findOne({
      where: {
        id: req.params.id,
      },
    });

    //if contact is null return contact not exist
    return res.status(status.OK).json({
      status: success,
      contact,
    });
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      error: error.message,
    });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    var { phone, password, newPassword } = req.body;

    const result = resetPassword(req.body);

    if (result.error != null) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: result.error.details[0].message,
      });
    }

    if (phone) {
      var user = await User.findOne({
        where: {
          phone,
        },
      });
      if (!user) {
        return res.status(status.NOT_FOUND).json({
          status: fail,
          message: UserNotFound,
        });
      }
    }

    var passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(status.BAD_REQUEST).json({
        status: fail,
        message: InvalidCredentials,
      });
    }

    password = bcrypt.hashSync(newPassword, 8);
    await user.update({ password });
    await user.save();

    res.status(status.OK).json({
      status: 1,
      message: PasswordReset,
      user,
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      status: fail,
      message: error.message,
    });
  }
};
exports.updateProfileImg = async (req, res) => {
  const user_id = req.user.id;
  let { phone } = req.body;
  profileImg = req.file.path;
  try {
    let user = await User.findOne({
      where: { id: user_id },
    });
    if (!user) {
      return res.status(status.BAD_REQUEST).json({
        status: 0,
        message: UserNotFound,
      });
    }
    await user.update({ profileImg });
    await user.save();
    return res.status(status.OK).json({
      status: success,
      message: ImageUpdated,
      user,
    });
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error,
    });
  }
};

exports.userUpdate = async (req, res) => {
  const user_id = req.user.id;
  let { statusMessage, firstName, lastName, profileImg } = req.body;
  try {
    let user = await User.findOne({
      where: { id: user_id },
    });
    if (!user) {
      return res.status(status.BAD_REQUEST).json({
        status: 0,  
        message: UserNotFound,
      });
    }
    if (!req.file) {
      profileImg = user.profileImg;
    }
    if (req.file) {
      profileImg = req.file.location;
    }
    await user.update({ statusMessage, firstName, lastName, profileImg });
    await user.save();
    return res.status(status.OK).json({
      status: success,
      message: UserUpdated,
      user,
    });
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error.message,
    });
  }
};
exports.settingsUpdate = async (req, res) => {
  const user_id = req.user.id;
  let { pushNotification, chatBackup, disappearingMessages } = req.body;
  try {
    let user = await UserSetting.findOne({
      where: { userId: user_id },
    });
    if (!user) {
      return res.status(status.BAD_REQUEST).json({
        status: 0,
        message: UserNotFound,
      });
    }
    let getUserFcm = await UserFcmToken.update(
      { pushNotification: pushNotification },
      { where: { userId: user_id } }
    );
    await user.update({ pushNotification, chatBackup, disappearingMessages });
    await user.save();
    return res.status(status.OK).json({
      status: success,
      message: SettingUpdated,
      user,
    });
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error,
    });
  }
};
exports.deleteUser = async (req, res) => {
  const user_id = req.user.id;
  try {
    let user = await User.findOne({
      where: { id: user_id },
    });
    if (!user) {
      return res.status(status.BAD_REQUEST).json({
        status: 0,
        message: UserNotFound,
      });
    }
    await user.destroy();
    return res.status(status.OK).json({
      status: "Deleted Successfully",
    });
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).send({ message: error.message });
  }
};
exports.blockContact = async (req, res) => {
  const contactOf = req.user.id;
  let { contact } = req.body;
  try {
    let getContact = await ContactList.findOne({
      where: {
        contactOf: contactOf,
        contact: contact,
      },
    });
    if (!getContact) {
      return res.status(status.BAD_REQUEST).json({
        status: 0,
        message: ContactNotFound,
      });
    }
    if (getContact.status == userStatus.unblocked) {
      let blockedUser = await ContactList.update(
        { status: userStatus.blocked },
        {
          where: {
            contactOf: contactOf,
            contact: contact,
          },
        }
      );

      return res.status(status.OK).json({
        status: success,
        message: UserBlocked,
      });
    }
    if (getContact.status == userStatus.blocked) {
      let unblockedUser = await ContactList.update(
        { status: userStatus.unblocked },
        {
          where: {
            contactOf: contactOf,
            contact: contact,
          },
        }
      );
      return res.status(status.OK).json({
        status: success,
        message: UserUnblocked,
      });
    }
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error.message,
    });
  }
};

exports.blockContactList = async (req, res) => {
  try {
    let getContact = await ContactList.findAll({
      where: {
        contactOf: req.user.id,
        status: "blocked",
      },
      include: [
        {
          model: User,
          as: "contactList",
        },
      ],
    });
    if (getContact.length < 1) {
      return res.status(status.BAD_REQUEST).json({
        status: 0,
        message: ContactNotFound,
      });
    }
    return res.status(status.OK).json({
      status: 1,
      contact: getContact,
    });
  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.media = async (req, res) => {
  try {
    // upload.array(files)
    var files = req.files;
    console.log("======files======", files);
    var mediaFiles = [];
    if (!files || files.length < 1) {
      return res.status(status.OK).json({
        status: fail,
        message: fileRequired,
      });
    }
    i = 0;
    var thumnailfile;
    for (i = 0; i < files.length;) {
      if (files[i].mimetype.startsWith("video") == true) {
        Thumbler(
          {
            type: "video",
            input: files[i].path,
            output: "uploads/" + files[i].originalname + i + ".jpeg",
            time: "00:00:01",
            // size: '300x200' // this optional if null will use the desimention of the video
          },
          async function (err, path) {
            if (err) return err;
            console.log("path", path);
            thumnailfile = path;

            videoThumbnail = await uploadThumbnailToS3(thumnailfile);
            mediaFiles.push({
              thumbnail: videoThumbnail.Location,
              type: files[i].mimetype,
              name: files[i].originalname,
            });
            fs.unlinkSync(thumnailfile);
          }
        );
        result = await uploadToS3(files[i]);
        mediaFiles[i]["uri"] = result.Location;
        fs.unlinkSync(files[i].path);
        i++;
      } else {
        result = await uploadToS3(files[i]);
        mediaFiles.push({
          uri: result.Location,
          type: files[i].mimetype,
          name: files[i].originalname,
        });
        fs.unlinkSync(files[i].path);
        i++;
      }
    }
    return res.status(status.OK).json({
      status: success,
      // files:media,
      files: mediaFiles,
    });
  } catch (error) {
    return res.status(status.INTERNAL_SERVER_ERROR).json({
      status: 0,
      error: error.message,
    });
  }
};

exports.deleteMessages = async () => {
  try {
    var userList = [];
    var counter = 0;
    var chatLength = 2;
    const getAllUsers = await UserSetting.findAll({
      where: { disappearingMessages: true },
      attributes: ["userId"],
    });
    getAllUsers.map((user) => {
      userList.push(user.userId);
    });
    db.collection("chats")
      .get()
      .then(async (allChats) => {
        // console.log("total chats ",allChats._size)
        await Promise.all(
          allChats.docs.map(async (chat) => {
            console.log("Chat id", chat.id);
            await db
              .collection("chats")
              .doc(chat.id)
              .collection("messages")
              .get()
              .then(async (allMessages) => {
                await Promise.all(
                  allMessages.docs.map(async (message) => {
                    await db
                      .collection("chats")
                      .doc(chat.id)
                      .collection("messages")
                      .doc(message.id)
                      .get()
                      .then((singleMessage) => {
                        var messageTime = moment(
                          singleMessage._fieldsProto.createdAt.stringValue
                        );
                        var currentTime = moment(new Date());
                        var timeDifference = currentTime.diff(
                          messageTime,
                          "minutes"
                        );
                        console.log(
                          "Message Details ",
                          singleMessage._fieldsProto.text
                        );
                        const result = userList.includes(
                          singleMessage._fieldsProto.user.mapValue.fields._id
                            .integerValue
                        );
                        console.log("result ", result);
                        if (
                          userList.includes(
                            parseInt(
                              singleMessage._fieldsProto.user.mapValue.fields
                                ._id.integerValue
                            )
                          )
                        ) {
                          console.log("include in array ");
                          if (timeDifference > 1440) {
                            db.collection("chats")
                              .doc(chat.id)
                              .collection("messages")
                              .doc(message.id)
                              .update({ isDeleted: true });
                            console.log("deleted");
                          }
                        }
                      })
                      .catch();
                  })
                );
              })
              .catch();
            counter++;
          })
        );
        if (chatLength == counter) {
          return console.log("Messages Deleted...");
        }
      })
      .catch((err) => {
        return console.log("Error...", err.message);
      });
  } catch (error) {
    return console.log("Error...", error.message);
  }
};

exports.sendMessageNotification = async (req, res) => {
  const { title, notification, sendTo } = req.body;

  tokensArray = [];

  const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };

  // const createNewNotification=await Notification.create({title,notification})
  const payload = {
    notification: {
      title: title,
      body: notification,
    },
  };
console.log('Payloadddddddd',payload)
  const getTokens = await UserFcmToken.findAll(
    {
      where: {
        userId: sendTo,
        pushNotification: true,
      },
    },
    { attributes: ["fcmToken"] }
  );

  if (getTokens.length < 1) {
    return res.status(200).json({
      status: fail,
      message: "No device exist for notification",
    });
  }

  getTokens.map((token) => {
    let = tokensArray.push(token.fcmToken);
  });

  const options = notification_options;

  admin
    .messaging()
    .sendToDevice(tokensArray, payload, options)
    .then((response) => {
      return res.status(200).json({
        status: success,
        message: notificationSend,
        response,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(status.INTERNAL_SERVER_ERROR).json({
        status: fail,
        error: error.message,
      });
    });
};

exports.reportUser = async (req, res) => {
  const { userId, comment } = req.body;
  //report to user id
  try {
    let findUser = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!findUser) {
      return res.status(status.NOT_FOUND).json({
        status: fail,
        message: "User does not exist",
      });
    }

    let getUser = await ReportedUser.findOne({
      where: {
        reportBy: req.user.id,
        reportto: userId,
        comment,
      },
    });

    if (!getUser) {
      let reportUser = await ReportedUser.create({
        reportBy: req.user.id,
        reportto: userId,
        comment,
      });

      return res.status(status.CREATED).json({
        status: success,
        message: "User reported successfully",
      });
    }

    return res.status(status.OK).json({
      status: success,
      message: "User already reported ",
    });
  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

exports.inviteFriend = async (req, res) => {
  const { sendTo } = req.body;

  const client = require("twilio")(accountSid, authToken);

  const getUser = await User.findOne({
    where: {
      id: req.user.id,
    },
  });

  try {

    const result = await client.messages.create({
      body: getUser + "invites you to join desend app",
      from: getUser.phone,
      to: "+923061271997",
    });

    return res.status(200).json({
      status: success,
      message: otpSent,
      data: result,
    });

  } catch (error) {
    return res.status(500).json({
      status: fail,
      message: error.message,
    });
  }
};

// exports.chatBackup = async (req, res, next) => {
//   try {
//     let user = await User.findAll();
//     user = user.map((inst) => inst.id)

//     for (let i = 0; i < user.length; i++) {
//       const id = user[i];

//       const queryByName = (collectionRef) =>
//         collectionRef.where('members', 'array-contains',
//           id).get()

//       const chats = await backup('chats', {
//         queryCollection: queryByName,
//       })

//       let userProfile = await User.findByPk(id);

//       if (userProfile.isBackup) {
//         await User.update({
//           backup: chats
//         }, {
//           where: {
//             id
//           }
//         })
//       }

//     }

//   }
//   catch (err) {
//     return res.status(500).json({
//       status: fail,
//       message: err.message,
//     });
//   }
// };



exports.logOut = async (req, res) => {
  try {
    const user_id = req.user.id;

    const getFcmToken = await UserFcmToken.destroy({
      where: {
        userId: user_id,
      },
    });

    return res.status(status.OK).json({
      status: success,
      message: "Log out",
    });

  } catch (error) {
    res.status(500).json({
      status: fail,
      message: error,
    });
  }
};

// exports.generateRTCToken = async (req, resp, next) => {

//   resp.header('Access-Control-Allow-Origin', '*');
//   let { query: { expireTime = 3600000, channelName, uid, } } = req;
//   let token;
//   let APP_ID = process.env.AGORA_APPLE_ID
//   let APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE
//   let role;

//   if (!channelName) {
//     return resp.status(500).json({ 'error': 'channel is required' });
//   }

//   if (!uid || uid === '') {
//     return resp.status(500).json({ 'error': 'uid is required' });
//   }

//   if (req.query.role === 'publisher') {

//     role = RtcRole.PUBLISHER;

//   } else if (req.query.role === 'audience') {

//     role = RtcRole.SUBSCRIBER

//   } else {

//     return resp.status(500).json({ 'error': 'role is incorrect' });
//   }

//   if (!expireTime || expireTime === '') {
//     expireTime = 3600;
//   } else {
//     expireTime = parseInt(3600, 10);
//   }

//   const currentTime = Math.floor(Date.now() / 1000);
//   const privilegeExpireTime = currentTime + expireTime;

//   if (req.query.tokentype === 'userAccount') {
//     token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);

//   } else if (req.query.tokentype === 'uid') {
//     token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);

//   } else {
//     return resp.status(500).json({ 'error': 'token type is invalid' });
//   }

//   return resp.json({ 'rtcToken': token });

// }

// exports.chatBackupNew = async (req, res, next) => {
//   try {
//     var userList = [];
//     var counter = 0;
//     var chatLength = 2;
//     const getAllUsers = await UserSetting.findAll({
//       where: { disappearingMessages: true },
//       attributes: ["userId"],
//     });
//     getAllUsers.map((user) => {
//       userList.push(user.userId);
//     });
//     db.collection("chats")
//       .where('members', 'array-contains',
//         27)
//       .get()
//       .then(async (allChats) => {
//         // console.log("total chats ",allChats._size)
//         await Promise.all(
//           allChats.docs.map(async (chat) => {
//             console.log("Chat id", chat.id);
//             await db
//               .collection("chats")
//               .doc(chat.id)
//               .collection("messages")
//               .get()
//               .then(async (allMessages) => {
//                 await Promise.all(
//                   allMessages.docs.map(async (message) => {
//                     await db
//                       .collection("chats")
//                       .doc(chat.id)
//                       .collection("messages")
//                       .doc(message.id)
//                       .get()
//                       .then((singleMessage) => {
//                         var messageTime = moment(
//                           singleMessage._fieldsProto.createdAt.stringValue
//                         );
//                         var currentTime = moment(new Date());
//                         var timeDifference = currentTime.diff(
//                           messageTime,
//                           "minutes"
//                         );
//                         console.log(
//                           "Message Details ",
//                           singleMessage._fieldsProto.text
//                         );
//                         const result = userList.includes(
//                           singleMessage._fieldsProto.user.mapValue.fields._id
//                             .integerValue
//                         );
//                         console.log("result ", result);
//                         ChatBackup.create({
//                           backup: singleMessage._fieldsProto.text.stringValue,
//                           userId: 27,
//                           chatId: chat.id,
//                           messageTime:messageTime
//                         })
//                       })
//                       .catch();
//                   })
//                 );
//               })
//               .catch();
//             counter++;
//           })
//         );
//         if (chatLength == counter) {
//           return console.log("Messages Deleted...");
//         }
//       })
//       .catch((err) => {
//         return console.log("Error...", err.message);
//       });
//   } catch (error) {
//     return console.log("Error...", error.message);
//   }
// }

exports.generateRTMToken = (req, resp) => {
  const appID = process.env.AGORA_APPLE_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE
  const role = RtmRole.Rtm_User;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;
  const userAccount = req.query.id;

  const token = RtmTokenBuilder.buildToken(appID, appCertificate, userAccount, role, expirationTimestamp);
  return resp.json({ 'rtmToken': token });

}

// exports.chatBackupNewwww = async (req, res) => {
//   try {
//     let a = db.collection("chats")
//       .doc(268)
//       .collection("messages")
//       .orderBy("createdAt", "desc")
//       .get()
//     console.log(a)
//   } catch (error) {
//     console.log(error)
//   }
// }


// exports.chatBackup = async (req, res, next) => {
//   var userList = [];
//   var counter = 0;
//   var chatLength = 2;
//   const getAllUsers = await UserSetting.findAll({
//     where: { disappearingMessages: true },
//     attributes: ["userId"],
//   });
//   getAllUsers.map((user) => {
//     userList.push(user.userId);
//   });

//   let chats = await db.collection('chats').get();
//   chats = chats.docs.map((ins) => {
//     return ins.id
//   })

//   for (let i = 0; i < chats.length; i++) {
//     const element = chats[i];
//     let allMessages = await db.collection('chats')
//       .doc(element)
//       .collection('messages')
//       .get()

//       allMessages = allMessages.docs.map((ins) => {
//         return ins.id
//       })

//     console.log(allMessages);

//     for (let index = 0; index < allMessages.length; index++) {
//       const ele = allMessages[index];
//       let singleMessage = await db.collection('chats')
//         .doc(element)
//         .collection('messages')
//         .doc(ele)
//         .get()

//       console.log(singleMessage)
//     }
//   }
// }


exports.backupMessages = async () => {
  try {
    var userList = [];
    userList.push(req.user.id);

    db.collection("chats")
      .get()
      .then(async (allChats) => {
        // console.log("total chats ",allChats._size)
        await Promise.all(
          allChats.docs.map(async (chat) => {
            console.log("Chat id", chat.id);
            await db
              .collection("chats")
              .doc(chat.id)
              .collection("messages")
              .get()
              .then(async (allMessages) => {
                await Promise.all(
                  allMessages.docs.map(async (message) => {
                    await db
                      .collection("chats")
                      .doc(chat.id)
                      .collection("messages")
                      .doc(message.id)
                      .get()
                      .then((singleMessage) => {
                        var messageTime = moment(
                          singleMessage._fieldsProto.createdAt.stringValue
                        );
                        var currentTime = moment(new Date());
                        var timeDifference = currentTime.diff(
                          messageTime,
                          "minutes"
                        );
                        console.log(
                          "Message Details ",
                          singleMessage._fieldsProto.text
                        );
                        const result = userList.includes(
                          singleMessage._fieldsProto.user.mapValue.fields._id
                            .integerValue
                        );
                        console.log("result ", result);
                        if (
                          userList.includes(
                            parseInt(
                              singleMessage._fieldsProto.user.mapValue.fields
                                ._id.integerValue
                            )
                          )
                        ) {
                          console.log("include in array ");
                          db.collection("chats")
                            .doc(chat.id)
                            .collection("messages")
                            .doc(message.id)
                            .update({ isDeleted: false });
                          console.log("deleted");
                        }
                      })
                      .catch();
                  })
                );
              })
              .catch();
            counter++;
          })
        );
        if (chatLength == counter) {
          return console.log("Messages Deleted...");
        }
      })
      .catch((err) => {
        return console.log("Error...", err.message);
      });
  } catch (error) {
    return console.log("Error...", error.message);
  }
};

exports.sendFcm = async (req, res, next) => {
  try {
    let userId = req.user.id 
    let userFcm = await UserFcmToken.findOne({
      where: {
        userId: userId
      },
      order: [
        ['id', 'DESC']
      ]
    })
    if(!userFcm || !userFcm.fcmToken) {
      throw('Fcm token not found')
    }

    let serverKey = "AAAA0ji_iG4:APA91bHgMuW__4Gy68Qa9HR6SZ39wZD_sCDV-RMVfTDhB7ru4Vom-sQBr1eLhDHGVbupXAMs0GcHJX3qAHgfbiW5JaysHYfZobO7BVfK2HDeRtTGEII3cvgW0JbKUNq-T0sXtni4qmDC"; //put your server key here 
    let fcm = new FCM(serverKey);
    let { notification, data, dataOnly = false } = req.body 
    let message = {
      to: userFcm.fcmToken,
      notification,
      data
    }
    if(dataOnly) {
      message = {
        to: userFcm.fcmToken,
        data
      }  
    }
    let result = await (new Promise((resolve, reject) => {
      fcm.send(message, (err, r) => {
        if(err) reject(typeof err === 'string' ? JSON.parse(err) : err)
        else resolve(typeof r === 'string' ? JSON.parse(r) : r)
      })
    }))

    return res.status(200).json({
      success: true,
      fcmResponse: result
    })

  } catch(e) {
    return res.status(400).json({
      error: true,
      message: e
    })   
  }
}