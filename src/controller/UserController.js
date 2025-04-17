const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const session = require('express-session');
const viewConfig = require('../config/viewConfig.js'); 
// Kết nối CSDL

// Kiểm tra kết nối database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

exports.showUserLogin = (req, res) => {
    res.render('login/login_nor', { error: null });
};
exports.showUserSignin = (req, res) => {
    res.render('login/signin_nor', { error: null });
};
exports.showUserForgot = (req, res) => {
    res.render('login/forgotpass-nor', { error: null });
};

exports.showUserForgotAdmin = (req, res) => {
    res.render('login/forgotpass-admin', { error: null });
};
exports.loginUser = async (req, res) => {
    try {
        let username = req.body.username;
        let password = req.body.password;
        
        if (!username || !password) {
            return res.render('login/login_nor', { error: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        connection.query(
            'SELECT * FROM user WHERE username = ?', 
            [username], 
            async function(error, results) {
                if (error) {
                    return res.render('login/login_nor', { error: 'Lỗi hệ thống!' });
                }
                
                if (results.length > 0) {
                    const user = results[0];
                    const match = await bcrypt.compare(password, user.password);
                    
                    if (match) {
                        req.session.user = {
                            id: user.id,
                            username: user.username,
                            fullName: user.fullName,
                            email: user.email,
                            role: user.role || 'user'
                        };
                        return res.redirect('/home');
                    }
                }
                return res.render('login/login_nor', { error: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
            }
        );
    } catch (err) {
        return res.render('login/login_nor', { error: 'Lỗi hệ thống!' });
    }
};

// Hiển thị login cho admin
exports.showAdminLogin = (req, res) => {
    res.render('login/login_admin.ejs', { error: null });
};


exports.loginAdmin = (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;
    const role = 'admin';

    connection.query('SELECT * FROM users WHERE username = ? AND role = ?', [username, role], async (err, results) => {
        if (err) return res.send('Lỗi CSDL');
        if (results.length === 0) return res.render('login/login_admin.ejs', { error: 'Sai thông tin quản trị' });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) return res.render('login/login_admin.ejs', { error: 'Sai mật khẩu' });

        req.session.user = { 
            id: admin.id, 
            username: admin.username, 
            role: admin.role 
        };
        res.redirect('/admin/home');
    });
};
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/home');
    });
};
// Home user
exports.userHome = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index', { user: req.session.user });
};

// Home admin
exports.adminHome = (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/admin/login');
    }
    res.render('admin/admin.ejs', { user: req.session.user });
};

exports.registerUser = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Validate input
        if (!fullName || !username || !email || !password) {
            return res.render('login/signin_nor', { 
                error: 'Vui lòng điền đầy đủ thông tin!'
            });
        }

        // Check if username already exists
        connection.query(
            'SELECT * FROM user WHERE username = ?',
            [username],
            async (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.render('login/signin_nor', { 
                        error: 'Lỗi hệ thống, vui lòng thử lại sau!'
                    });
                }

                if (results.length > 0) {
                    return res.render('login/signin_nor', { 
                        error: 'Tên đăng nhập đã tồn tại!'
                    });
                }

                // Check if email already exists
                connection.query(
                    'SELECT * FROM user WHERE email = ?',
                    [email],
                    async (error, results) => {
                        if (error) {
                            console.error('Database error:', error);
                            return res.render('login/signin_nor', { 
                                error: 'Lỗi hệ thống, vui lòng thử lại sau!'
                            });
                        }

                        if (results.length > 0) {
                            return res.render('login/signin_nor', { 
                                error: 'Email đã được sử dụng!'
                            });
                        }

                        // Hash password
                        const hashedPassword = await bcrypt.hash(password, 10);

                        // Insert new user
                        connection.query(
                            'INSERT INTO user (fullName, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
                            [fullName, username, email, hashedPassword, 'user', 'active'],
                            (error, results) => {
                                if (error) {
                                    console.error('Database error:', error);
                                    return res.render('login/signin_nor', { 
                                        error: 'Lỗi hệ thống, vui lòng thử lại sau!'
                                    });
                                }

                                // Create session for new user
                                req.session.user = {
                                    id: results.insertId,
                                    username: username,
                                    role: 'user'
                                };

                                res.redirect('/home');
                            }
                        );
                    }
                );
            }
        );
    } catch (err) {
        console.error('Server error:', err);
        return res.render('login/signin_nor', { 
            error: 'Lỗi hệ thống, vui lòng thử lại sau!'
        });
    }
};

// Hiển thị trang thông tin tài khoản
exports.showAccountDetail = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('account-detail', { 
        user: req.session.user,
        error: null 
    });
};

// Hiển thị trang tin đã lưu
exports.showSavedNews = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('saved-news', { 
        savedNews: [],
        error: null 
    });
};

// Cập nhật thông tin tài khoản
exports.updateAccount = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { fullName, email } = req.body;

    try {
        connection.query(
            'SELECT * FROM user WHERE email = ? AND id != ?',
            [email, req.session.user.id],
            async (error, results) => {
                if (error) {
                    return res.render('account-detail', { 
                        error: 'Lỗi hệ thống!',
                        user: req.body
                    });
                }

                if (results.length > 0) {
                    return res.render('account-detail', { 
                        error: 'Email đã được sử dụng!',
                        user: req.body
                    });
                }

                connection.query(
                    'UPDATE user SET fullName = ?, email = ? WHERE id = ?',
                    [fullName, email, req.session.user.id],
                    (error) => {
                        if (error) {
                            return res.render('account-detail', { 
                                error: 'Lỗi hệ thống!',
                                user: req.body
                            });
                        }
                        // Cập nhật session
                        req.session.user.fullName = fullName;
                        req.session.user.email = email;
                        return res.redirect('/account-detail');
                    }
                );
            }
        );
    } catch (err) {
        return res.render('account-detail', { 
            error: 'Lỗi hệ thống!',
            user: req.body
        });
    }
};

// Lưu tin tức
exports.saveNews = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
    }

    const { newsId } = req.body;

    try {
        connection.query(
            'INSERT INTO saved_news (user_id, news_id) VALUES (?, ?)',
            [req.session.user.id, newsId],
            (error) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ error: 'Lỗi hệ thống!' });
                }

                return res.json({ message: 'Đã lưu tin tức thành công!' });
            }
        );
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Lỗi hệ thống!' });
    }
};

// Bỏ lưu tin tức
exports.unsaveNews = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập!' });
    }

    const { newsId } = req.body;

    try {
        connection.query(
            'DELETE FROM saved_news WHERE user_id = ? AND news_id = ?',
            [req.session.user.id, newsId],
            (error) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({ error: 'Lỗi hệ thống!' });
                }

                return res.json({ message: 'Đã bỏ lưu tin tức thành công!' });
            }
        );
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Lỗi hệ thống!' });
    }
};
