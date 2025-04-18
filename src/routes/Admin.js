const express = require('express');
const router = express.Router();
const adminController = require('../controller/AdminController');

// Debug middleware for admin routes
router.use((req, res, next) => {
    console.log('\n=== Admin Route Debug ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Session:', req.session);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('========================\n');
    next();
});

// Middleware kiểm tra đăng nhập admin
const checkAdminAuth = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/admin/login');
    }
    next();
};

// Route đăng nhập
router.get('/login', adminController.showAdminLogin);
router.post('/auth-admin', adminController.loginAdmin);

// Route trang chủ admin
router.get('/home', checkAdminAuth, adminController.adminHome);

// Route quản lý bài báo
router.get('/news', checkAdminAuth, adminController.manageNews);
router.get('/news/edit/:id', checkAdminAuth, adminController.showEditNews);
router.put('/news/edit/:id', checkAdminAuth, adminController.updateNews);

// Route quản lý danh mục
router.get('/categories', checkAdminAuth, adminController.manageCategories);

// Route quản lý giải đấu
router.get('/tournaments', checkAdminAuth, adminController.manageTournaments);

// Route quản lý người dùng
router.get('/users', checkAdminAuth, adminController.manageUsers);

// Route hồ sơ cá nhân
router.get('/profile', checkAdminAuth, adminController.showProfile);

// Route đăng xuất
router.get('/logout', adminController.logout);

// Route xóa bài báo
router.delete('/news/delete/:id', adminController.deleteNews);

module.exports = router;

