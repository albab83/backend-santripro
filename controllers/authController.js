const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

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
      { userId: plainUser.id, role: plainUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
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
