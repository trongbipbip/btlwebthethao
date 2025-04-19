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
router.get('/news/create', checkAdminAuth, adminController.showCreateNews);
router.post('/news/create', checkAdminAuth, adminController.createNews);
router.get('/news/edit/:id', checkAdminAuth, adminController.showEditNews);
router.put('/news/edit/:id', checkAdminAuth, adminController.updateNews);
router.delete('/news/:id', checkAdminAuth, adminController.deleteNews);

// Route quản lý danh mục
router.get('/categories', checkAdminAuth, adminController.manageCategories);
router.get('/categories/create', checkAdminAuth, adminController.showCreateCategory);
router.post('/categories/create', checkAdminAuth, adminController.createCategory);

// Route quản lý giải đấu
router.get('/tournaments', checkAdminAuth, adminController.manageTournaments);
router.get('/tournaments/create', checkAdminAuth, adminController.showCreateTournament);
router.post('/tournaments/create', checkAdminAuth, adminController.createTournament);
router.get('/tournaments/edit/:id', checkAdminAuth, adminController.showEditTournament);
router.put('/tournaments/edit/:id', checkAdminAuth, adminController.updateTournament);
router.post('/tournaments/delete/:id', checkAdminAuth, adminController.deleteTournament);

// Route quản lý người dùng
router.get('/users', checkAdminAuth, adminController.manageUsers);
router.post('/users/toggle-status/:id', checkAdminAuth, adminController.toggleUserStatus);
router.post('/users/delete/:id', checkAdminAuth, adminController.deleteUser);

// Route quản lý góp ý
router.get('/suggestion', checkAdminAuth, adminController.manageSuggestions);

// Route hồ sơ cá nhân
router.get('/profile', checkAdminAuth, adminController.showProfile);
router.post('/profile/update-avatar', checkAdminAuth, adminController.updateAvatar);
router.post('/profile/change-password', checkAdminAuth, adminController.changePassword);

// Route đăng xuất
router.get('/logout', adminController.logout);

module.exports = router;

