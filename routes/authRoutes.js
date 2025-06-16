const express = require("express");
const {
  register,
  login,
  registerAdmin,
  getMe,
  lupaPassword,
  resetPassword,
} = require("../controllers/authController");
const { verifyAdmin, verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register); // Register route
router.post("/login", login); // Login route
router.post("/registerAdmin", verifyAdmin, registerAdmin);
router.get("/getMe", verifyToken, getMe);
router.post('/lupa-password', lupaPassword);
router.post('/reset-password/:token', resetPassword);


module.exports = router;
