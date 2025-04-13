const express = require('express');
const router = express.Router();
const authController = require('../controller/UserController');

// Admin login
router.get('/login', authController.showAdminLogin);
router.post('/login', authController.loginAdmin);

// Admin home
router.get('/home', authController.adminHome);

module.exports = router;
