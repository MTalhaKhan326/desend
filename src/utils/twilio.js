const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const VideoGrant = AccessToken.VideoGrant;
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_KEY } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_KEY);

function generateVideoToken(identity, room) {
  const videoGrant = new VideoGrant({
    room,
  });
  return createAccessToken(videoGrant, identity);
}
function generateChatToken(identity, deviceId) {
  const appName = "DesendChat";

  // Create a unique ID for the client on their current device
  const endpointId = appName + ":" + identity + ":" + deviceId;

  // Create a "grant" which enables a client to use Chat as a given user,
  // on a given device
  const chatGrant = new ChatGrant({
    serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    endpointId: endpointId,
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  return createAccessToken(chatGrant, identity);
}

const createAccessToken = (grand, identity) => {
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );

  token.addGrant(grand);
  token.identity = identity;
  return token;
};
const sendMessage = async function (user) {
  const twilioResp = await client.messages
    .create({
      body: "Your verification code is " + user.verificationCode,
      from: "Dawiyni",
      to: "+222" + user.phoneNumber,
    })
    .catch((error) => {
      console.error(error.message);
    });
  console.log(twilioResp);
};

module.exports.twilio = { generateVideoToken, generateChatToken, sendMessage };
