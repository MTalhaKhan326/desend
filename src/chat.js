import firestore from "@react-native-firebase/firestore";
import { colors } from "../constants/colors";

//this function use for existing chat message

export const sendMessage = async (message, users, groupName, adminId) => {
  const chatId = await createChatId(users, groupName);

  firestore()
    .collection("chats")
    .where("chatId", "==", chatId)
    .get()
    .then((res) => {
      let exists = false;

      res.docs.forEach((document) => {
        if (document.exists) {
          exists = true;
          firestore()
            .collection("chats")
            .doc(chatId)
            .update({
              lastmessage: message,
              visibleTo:
                [...new Set(users)].length > 2
                  ? [...new Set(users), ...["group"]]
                  : users,
            })
            .then((res) => {
              firestore()
                .collection("chats")
                .doc(chatId)
                .collection("messages")
                .add(message);
            });
        }
      });
      if (!exists) {
        startNewChat(message, users, chatId, groupName, adminId);
      }
    });
};

//this function for new chat messages

export const startNewChat = (message, users, chatId, groupName, adminId) => {
  firestore()
    .collection("chats")
    .doc(users.length > 2 ? groupName : chatId)
    .set({
      members: users,
      createdAt: new Date(),
      chatId: users.length > 2 ? groupName : chatId,
      admin: adminId,
      visibleTo:
        [...new Set(users)].length > 2
          ? [...new Set(users), ...["group"]]
          : [...new Set(users)],
      lastmessage: message,
      deleteTo: users,
      blockTo: [],
      pinTo: [],
      archiveTo: [],
      markasReadTo: [],
      leaveTo: [],
      bubbleColor: { key0: colors.sendBubbleColor },
    })
    .then((res) => {
      firestore()
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .add(message);
      // .then((res) => {
      //   console.log("message sent successfully in new chat");
      // });
    });
};

//this function use for join two email and convert into one email

export const createChatId = (users, otherName) => {
  let arr = [...new Set(users)];

  var val = "";
  for (var i = 0; i < arr.length; i++) {
    val = val + arr[i];
  }
  return arr.length > 2 ? otherName : val.split("").sort().join("");
};

export const ReportCollection = async (
  chatDoc,
  messageDoc,
  message,
  senderName,
  reciverName,
  media,
  audio
) => {
  let obj = {
    chatDoc,
    messageDoc,
    message,
    senderName,
    reciverName,
    media,
    audio,
  };
  firestore().collection("report").add(obj);
};