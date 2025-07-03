const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// User registration
router.post('/register', authController.register);

// User login
router.post('/login', authController.login);

// User logout
router.post('/logout', authController.logout);

// Get current session
router.get('/session', authController.getSession);

// Update user preferences
router.put('/preferences', authController.updatePreferences);

module.exports = router; 