const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_KEY
);

module.exports.getVideoToken = async (roomName, identity) => {
  let roomInstance = await createRoom(roomName);
  let token = libs.twilio.generateVideoToken(identity, roomInstance.uniqueName);
  //    const [roomInstance,token] = await Promise.all(
  //     [
  //         createRoom(roomName),
  //         libs.twilio.generateVideoToken(identity,roomName)
  //     ]
  //    )
  return {
    userInfo: { token: token.toJwt() },
    roomInfo: { sid: roomInstance.sid },
  };
};

const createRoom = async (roomName) => {
  try {
    return await client.video.rooms.create({ uniqueName: roomName });
  } catch (error) {
    // The room instance is already created, so just fetch it
    return await client.video.rooms(roomName).fetch();
    // handleCatch(error);
  }
};
