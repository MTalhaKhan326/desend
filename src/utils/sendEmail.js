const nodemailer = require("nodemailer");
const smtpTransport = require('nodemailer-smtp-transport');
const { prepareOtpTemplate } = require('./../email_templates/otp_template');
const { prepareForgotPasswordTemplate } = require('./../email_templates/forgot_password');

exports.sendEmail = (email, subject, password) => {

  let transporter = nodemailer.createTransport(smtpTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: "faisalmahmood1196@gmail.com",
      pass: "Faisal@123"
    }
  }));

  let mailOptions = {
    from: 'muhammadfaisal1196@gmail.com',
    to: email,
    subject: subject,
    html: prepareOtpTemplate(password)
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log(error);
    console.log(info)
  });

}
exports.sendForgotPasswordEmail = (email, subject, code) => {

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
  console.log(code);
  let mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: subject,
    html: prepareForgotPasswordTemplate(code)
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log(error);
    console.log(info)
  });

}