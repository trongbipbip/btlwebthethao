const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const session = require('express-session');
const viewConfig = require('../config/viewConfig.js'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Kết nối CSDL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ngnhotrong@gmail.com',
        pass: 'hcbm okir tbbp umoq'
    }
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
            return res.render('login/login_nor', { 
                error: 'Vui lòng nhập đầy đủ thông tin!' 
            });
        }

        connection.query(
            'SELECT * FROM user WHERE username = ?', 
            [username], 
            async function(error, results) {
                if (error) {
                    return res.render('login/login_nor', { 
                        error: 'Lỗi hệ thống!' 
                    });
                }
                
			if (results.length > 0) {
                    const user = results[0];
                    const match = await bcrypt.compare(password, user.password);
                    
                    if (match) {
                        // Lưu thông tin vào session
                        req.session.user = {
                            id: user.id,
                            username: user.username,
                            fullName: user.fullName,
                            email: user.email,
                            role: user.role
                        };

                        return res.redirect('/home');
                    }
                }
                return res.render('login/login_nor', { 
                    error: 'Tên đăng nhập hoặc mật khẩu không đúng!' 
                });
            }
        );
    } catch (err) {
        return res.render('login/login_nor', { 
            error: 'Lỗi hệ thống!' 
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Lỗi khi đăng xuất:', err);
            return res.redirect('/home');
        }
        res.clearCookie('connect.sid'); // Xóa cookie session
        res.redirect('/login');
    });
};

// Home user
exports.userHome = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index', { user: req.session.user });
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

// Khởi tạo quá trình khôi phục mật khẩu
exports.initiatePasswordRecovery = async (req, res) => {
    try {
        console.log('=== Password Recovery Request ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        
        const { email } = req.body;
        
        if (!email) {
            console.log('No email provided in request body');
            return res.status(400).json({ 
                error: 'Vui lòng nhập email!'
            });
        }

        // Kiểm tra email có tồn tại trong database
        connection.query(
            'SELECT * FROM user WHERE email = ?',
            [email],
            async (error, results) => {
                if (error) {
                    console.error('Database query error:', error);
                    return res.status(500).json({ 
                        error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
                    });
                }

                console.log('Query results:', results);

                if (results.length === 0) {
                    return res.status(404).json({ 
                        error: 'Email không tồn tại trong hệ thống!'
                    });
                }

                // Tạo token khôi phục
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetTokenExpiry = new Date(Date.now() + 3600000); // Token hết hạn sau 1 giờ

                // Lưu token vào database
                connection.query(
                    'UPDATE user SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
                    [resetToken, resetTokenExpiry, email],
                    async (error) => {
                        if (error) {
                            console.error('Token update error:', error);
                            return res.status(500).json({ 
                                error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
                            });
                        }

                        // Gửi email khôi phục
                        const resetLink = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
                        const mailOptions = {
                            from: 'ngnhotrong@gmail.com',
                            to: email,
                            subject: 'Khôi phục mật khẩu',
                            html: `
                                <h1>Yêu cầu khôi phục mật khẩu</h1>
                                <p>Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
                                <a href="${resetLink}">Đặt lại mật khẩu</a>
                                <p>Link này sẽ hết hạn sau 1 giờ.</p>
                                <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
                            `
                        };

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log('Password reset email sent successfully');
                            return res.status(200).json({ 
                                success: 'Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn!'
                            });
                        } catch (error) {
                            console.error('Email sending error:', error);
                            return res.status(500).json({ 
                                error: 'Không thể gửi email khôi phục. Vui lòng thử lại sau!'
                            });
                        }
                    }
                );
            }
        );
    } catch (error) {
        console.error('General error:', error);
        return res.status(500).json({ 
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
        });
    }
};

// Hiển thị form đặt lại mật khẩu
exports.showResetPassword = (req, res) => {
    try {
        const { token } = req.params;
        console.log('Reset password token:', token);

        // Kiểm tra token có hợp lệ và chưa hết hạn
        connection.query(
            'SELECT * FROM user WHERE resetToken = ? AND resetTokenExpiry > ?',
            [token, new Date()],
            (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.render('login/reset-password', { 
                        token,
                        error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
                    });
                }

                if (results.length === 0) {
                    return res.render('login/reset-password', { 
                        token,
                        error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!'
                    });
                }

                res.render('login/reset-password', { token, error: null });
            }
        );
    } catch (error) {
        console.error('Error in showResetPassword:', error);
        res.render('login/reset-password', { 
            token: req.params.token,
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
        });
    }
};

// Xử lý đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
    try {
        console.log('Reset password request received');
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        console.log('Token:', token);
        console.log('Password received:', !!password);
        console.log('Confirm password received:', !!confirmPassword);

        // Validate input
        if (!password || !confirmPassword) {
            return res.render('login/reset-password', { 
                token,
                error: 'Vui lòng nhập đầy đủ thông tin!'
            });
        }

        if (password !== confirmPassword) {
            return res.render('login/reset-password', { 
                token,
                error: 'Mật khẩu và xác nhận mật khẩu không khớp!'
            });
        }

        if (password.length < 6) {
            return res.render('login/reset-password', { 
                token,
                error: 'Mật khẩu phải có ít nhất 6 ký tự!'
            });
        }

        // Kiểm tra token có hợp lệ và chưa hết hạn
        connection.query(
            'SELECT * FROM user WHERE resetToken = ? AND resetTokenExpiry > ?',
            [token, new Date()],
            async (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.render('login/reset-password', { 
                        token,
                        error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
                    });
                }

                if (results.length === 0) {
                    return res.render('login/reset-password', { 
                        token,
                        error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!'
                    });
                }

                try {
                    // Hash mật khẩu mới
                    const hashedPassword = await bcrypt.hash(password, 10);

                    // Cập nhật mật khẩu và xóa token
                    connection.query(
                        'UPDATE user SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?',
                        [hashedPassword, token],
                        (error) => {
                            if (error) {
                                console.error('Password update error:', error);
                                return res.render('login/reset-password', { 
                                    token,
                                    error: 'Đã xảy ra lỗi khi đặt lại mật khẩu!'
                                });
                            }

                            // Chuyển hướng về trang đăng nhập với thông báo thành công
                            res.redirect('/login?message=Mật khẩu đã được đặt lại thành công!');
                        }
                    );
                } catch (error) {
                    console.error('Password hashing error:', error);
                    return res.render('login/reset-password', { 
                        token,
                        error: 'Đã xảy ra lỗi khi mã hóa mật khẩu!'
                    });
                }
            }
        );
    } catch (error) {
        console.error('General error in resetPassword:', error);
        res.render('login/reset-password', { 
            token: req.params.token,
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau!'
        });
    }
};
