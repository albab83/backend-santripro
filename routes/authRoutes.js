const express = require('express');
const { register, login, registerAdmin } = require('../controllers/authController');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register); // Register route
router.post('/login', login); // Login route
router.post('/registerAdmin', verifyToken,verifyAdmin, registerAdmin);

module.exports = router;
