const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Register Santri
exports.register = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    // Cek jika email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }

    // Buat user baru
    const user = await User.create({ nama, email, password, role });
    return res.status(201).json({ message: 'User berhasil didaftarkan', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Login (Santri/Admin)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email tidak ditemukan!' });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah!' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Kirim response
    return res.status(200).json({ message: 'Login berhasil', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
