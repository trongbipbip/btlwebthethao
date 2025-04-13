const express = require('express')
const router = express.Router();
const authController = require('../controller/UserController.js');

// Hiển thị form đăng nhập
router.get('/login', authController.showUserLogin);
router.post('/login', authController.loginUser);

// User home
router.get('/user/home', authController.userHome);

// Đăng xuất
router.get('/logout', authController.logout);

module.exports = router;


