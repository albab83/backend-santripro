const express = require('express');
const { register, login, registerAdmin, getMe } = require('../controllers/authController');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register); // Register route
router.post('/login', login); // Login route
router.post('/registerAdmin', verifyToken, verifyAdmin, registerAdmin);
router.get('/getMe', verifyToken, getMe);

module.exports = router;
