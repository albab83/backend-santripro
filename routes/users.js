const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Hanya admin yang bisa melihat semua user
router.get("/", verifyToken, verifyAdmin, usersController.getAllUsers);

module.exports = router;
