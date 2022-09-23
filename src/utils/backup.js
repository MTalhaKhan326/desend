var schedule = require("node-schedule");
const {chatBackup } = require("../controllers/user.controller");


const rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.minute = 01;
rule.tz = "Etc/UTC";


// schedule.scheduleJob(rule, chatBackup);