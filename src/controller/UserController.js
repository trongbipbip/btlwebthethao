const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const viewConfig = require('../config/viewConfig.js'); 
// Kết nối CSDL

exports.showUserLogin = (req, res) => {
    res.render('login/login_nor', { error: null });
};

// Hiển thị login cho admin
exports.showAdminLogin = (req, res) => {
    res.render('login/login_admin.ejs', { error: null });
};

// Xử lý login user
exports.loginUser = (req, res) => {
    const { username, password } = req.body;
    const role = 'user';

    connection.query('SELECT * FROM users WHERE username = ? AND role = ?', [username, role], async (err, results) => {
        if (err) return res.send('Lỗi CSDL');
        if (results.length === 0) return res.render('login', { error: 'Sai thông tin người dùng' });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) return res.render('login', { error: 'Sai mật khẩu' });

        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.redirect('/user/home');
    });
};

// Xử lý login admin
exports.loginAdmin = (req, res) => {
    const { username, password } = req.body;
    const role = 'admin';

    db.query('SELECT * FROM users WHERE username = ? AND role = ?', [username, role], async (err, results) => {
        if (err) return res.send('Lỗi CSDL');
        if (results.length === 0) return res.render('admin_login', { error: 'Sai thông tin quản trị' });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) return res.render('admin_login', { error: 'Sai mật khẩu' });

        req.session.user = { id: admin.id, username: admin.username, role: admin.role };
        res.redirect('/admin/home');
    });
};

// Home user
exports.userHome = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'user') return res.redirect('/login');
    res.render('index', { user: req.session.user });
};

// Home admin
exports.adminHome = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/admin/login');
    res.render('admin/admin.ejs', { user: req.session.user });
};

// Đăng xuất chung
exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};