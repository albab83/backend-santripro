const nodemailer = require("nodemailer");
require("dotenv").config(); // penting kalau belum ada

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: `"SantriPro Notif" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email dikirim ke: ${to}`);
  } catch (error) {
    console.error("❌ Gagal kirim email:", error);
  }
}

module.exports = sendEmail;
