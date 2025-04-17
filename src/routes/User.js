const express = require('express')
const router = express.Router();
const authController = require('../controller/UserController.js');

// Hiển thị form đăng nhập
router.get('/login', authController.showUserLogin);
router.post('/auth', authController.loginUser);
router.post('/auth-admin', authController.loginAdmin);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);
router.get('/signin', authController.showUserSignin);
router.post('/register', authController.registerUser);
router.get('/forgotpass-nor', authController.showUserForgot);
router.get('/forgotpass-admin', authController.showUserForgotAdmin);

// Thông tin tài khoản và bài đã lưu
router.get('/account-detail', authController.showAccountDetail);
router.get('/saved-news', authController.showSavedNews);
router.post('/update-account', authController.updateAccount);
router.post('/save-news', authController.saveNews);
router.post('/unsave-news', authController.unsaveNews);

module.exports = router;


