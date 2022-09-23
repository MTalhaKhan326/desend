
var admin = require("firebase-admin");

var serviceAccount = require("./desend-firebase.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //   databaseURL: "https://sample-project-e1a84.firebaseio.com"
})
const db = admin.firestore();

module.exports.db = db
module.exports.admin = admin 