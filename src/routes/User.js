const express = require('express')
const router = express.Router();
const authController = require('../controller/UserController.js');

// Test route trong router
router.post('/forgotpass-test', (req, res) => {
    console.log('Forgotpass test route hit');
    console.log('Body:', req.body);
    res.json({ message: 'Forgotpass test route working' });
});

// Routes cho đăng nhập, đăng ký
router.get('/login', authController.showUserLogin);
router.post('/auth', authController.loginUser);
router.get('/signin', authController.showUserSignin);
router.post('/signin', authController.registerUser);

// Routes cho quên mật khẩu
router.get('/forgotpass-nor', authController.showUserForgot);
router.post('/forgotpass-nor', (req, res) => {
    console.log('=== Forgotpass Route Hit ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Body:', req.body);
    try {
        authController.initiatePasswordRecovery(req, res);
    } catch (error) {
        console.error('Error in forgotpass route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/reset-password/:token', authController.showResetPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Routes cho tài khoản
router.get('/account-detail', authController.showAccountDetail);
router.post('/account-detail', authController.updateAccount);
router.get('/saved-news', authController.showSavedNews);

// Route đăng xuất
router.get('/logout', authController.logout);

module.exports = router;


