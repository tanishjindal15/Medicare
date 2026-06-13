const nodemailer = require("nodemailer")

/* Shared email transporter (Gmail). Reused by auth OTPs and order confirmations. */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASSWORD
  }
})

/*
 * Send an email without ever throwing into the caller.
 * Used for non-critical mail (e.g. order confirmations) so a mail failure
 * never breaks the main request.
 */
const sendMailSafe = async (options) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, ...options })
  } catch (err) {
    console.error("Email send failed:", err.message)
  }
}

module.exports = { transporter, sendMailSafe }
