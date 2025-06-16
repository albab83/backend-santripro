const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const nodemailer = require("nodemailer");

// Register Santri
exports.register = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    // Cek jika email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    // Buat user baru
    const user = await User.create({ nama, email, password, role: "santri" });
    req.app.get("io").emit("user_update");
    return res.status(201).json({ message: "User berhasil didaftarkan", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// Login (Santri/Admin)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email tidak ditemukan!" });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password salah!" });
    }

    const plainUser = user.get({ plain: true });
    // Generate JWT token
    const token = jwt.sign(
      { userId: plainUser.id, nama: plainUser.nama, role: plainUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Kirim response
    return res.status(200).json({ message: "Login berhasil", token, user });
  } catch (error) {
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    // Cek jika email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    // Buat user baru
    const user = await User.create({ nama, email, password, role: "admin" });
    return res
      .status(201)
      .json({ message: "Admin berhasil didaftarkan", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.lupaPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email tidak ditemukan!" });
    }

    // Buat token reset password
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.RESET_TOKEN_EXPIRES || "15m",
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Kirim email dengan nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // Atau sesuaikan dengan SMTP lain
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Reset Password" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password Akun Anda",
      html: `
        <p>Hai ${user.nama || ""},</p>
        <p>Silakan klik link berikut untuk mengatur ulang password Anda:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link ini akan kedaluwarsa dalam 15 menit.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ message: "Link reset password telah dikirim ke email Anda" });
  } catch (error) {
    console.error("Error lupa password:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.status(200).json({ message: "Password berhasil direset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res
      .status(400)
      .json({ message: "Token tidak valid atau telah kedaluwarsa" });
  }
};
