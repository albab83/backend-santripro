const { User } = require("../models");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data users", error });
  }
};