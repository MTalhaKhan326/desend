var express = require('express');
const sequelize = require('./config/db.config');
const cors = require("cors");
const passport = require('passport')
const { authRoutes, userRoutes, adminRoutes,twilioRoutes, walletRoutes } = require('./routes/index.routes');
const { getJwtStrategy } = require('./config/passport')
const globalError = require('./middlewares/globalError')
let multer = require('multer');
let upload = multer();
var bodyParser = require("body-parser");
const cron = require('node-cron');
const { deleteMessages } = require('./controllers/user.controller');

var app = express();
// app.use(express.static('../src/uploads'))
app.use('/uploads',express.static('./src/uploads'));
app.use(bodyParser.json({limit: "500mb"}));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: "500mb" }));
// app.use('uploads',express.static('../src/uploads'));
require("./utils/backup");

const connectWithDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection To Database Has Been Established');
  } catch (error) {
    console.log('There is some error in syncing models', error);
  }
}

connectWithDB();


app.use(cors({
  origin: "*"
}));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the beginnings of nothingness." });
});


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/twilio', twilioRoutes);
app.use(`/api/v1/wallet`, walletRoutes)

// ...

//== Schedule tasks to be run on the server.
cron.schedule('0 */23 * * *', function() {
  deleteMessages()
});

passport.use(getJwtStrategy())
app.use(globalError);


module.exports = app;