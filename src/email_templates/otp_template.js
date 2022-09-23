exports.prepareOtpTemplate = (data) => `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
<div style="margin:50px auto;width:70%;padding:20px 0">
  <div style="border-bottom:1px solid #eee">
    <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Acqua Code</a>
  </div>
  <p style="font-size:1.1em">Hi,</p>
  <p>Thank you for showing your interest in our games. Use the following OTP to login to your account. OTP is valid for your first login</p>
  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${data}</h2>
  <p style="font-size:0.9em;">Regards,<br />Acqua Code</p>
  <hr style="border:none;border-top:1px solid #eee" />
  <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
    <p>Acqua Code</p>
    <p>1600 New York</p>
    <p>New York</p>
  </div>
</div>
</div>`
