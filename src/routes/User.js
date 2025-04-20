const express = require('express')
const router = express.Router();
const authController = require('../controller/UserController.js');
const articleController = require('../controller/Article.js');

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
router.get('/saved-news', articleController.showsavednews);
router.get('/api/check-saved/:newsId', articleController.checkSavedNews);
router.post('/api/toggle-save/:newsId', articleController.toggleSaveNews);
router.post('/unsave-news/:newsId', articleController.unsaveNews);
router.post('/api/clear-all-saved', articleController.clearAllSavedNews);

// Route cho góp ý
router.post('/api/submit-suggestion', articleController.submitSuggestion);
router.get('/api/suggestions/:userId', articleController.getUserSuggestions);

// Route đăng xuất
router.get('/logout', authController.logout);


//route cho admin
 

module.exports = router;


