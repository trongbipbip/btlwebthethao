const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const session = require('express-session');
const viewConfig = require('../config/viewConfig.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

exports.showAdminLogin = (req, res) => {
    try {
        res.render('login/login_admin.ejs', { error: null });
    } catch (error) {
        console.error('Error in showAdminLogin:', error);
        res.status(500).send('Error loading login page');
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        console.log('Login attempt:', { username: req.body.username });
        
        if (!req.body.username || !req.body.password) {
            return res.render('login/login_admin.ejs', { 
                error: 'Vui lòng nhập đầy đủ thông tin!'
            });
        }

        const [rows] = await connection.promise().query(
            'SELECT * FROM user WHERE username = ? AND role = ?',
            [req.body.username, 'admin']
        );

        if (!rows || rows.length === 0) {
            return res.render('login/login_admin.ejs', { 
                error: 'Tài khoản admin không tồn tại!'
            });
        }

        const match = await bcrypt.compare(req.body.password, rows[0].password);
        if (!match) {
            return res.render('login/login_admin.ejs', { 
                error: 'Mật khẩu không chính xác!'
            });
        }

        req.session.user = {
            id: rows[0].id,
            username: rows[0].username,
            fullName: rows[0].fullName,
            email: rows[0].email,
            role: 'admin'
        };

        console.log('Login successful, session:', req.session);
        res.redirect('/admin/home');

    } catch (error) {
        console.error('Error in loginAdmin:', error);
        res.render('login/login_admin.ejs', { 
            error: 'Lỗi hệ thống!'
        });
    }
};

exports.adminHome = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            console.log('No admin session, redirecting to login');
            return res.redirect('/admin/login');
        }

        console.log('Fetching data for admin dashboard...');

        // Lấy thống kê tin tức theo trạng thái
        const [newsStats] = await connection.promise().query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Đang hoạt động' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'Ngừng hoạt động' THEN 1 ELSE 0 END) as inactive
            FROM news
        `);

        // Đếm số lượng danh mục
        const [categoryCount] = await connection.promise().query(`
            SELECT COUNT(*) as count FROM categories
        `);

        // Đếm số lượng giải đấu
        const [tournamentCount] = await connection.promise().query(`
            SELECT COUNT(*) as count FROM tournaments
        `);

        // Lấy danh sách tin tức mới nhất kèm theo tên danh mục
        const [recentNews] = await connection.promise().query(`
            SELECT n.*, c.name as categoryName 
            FROM news n 
            LEFT JOIN categories c ON n.category_id = c.id 
            ORDER BY n.date DESC 
            LIMIT 10
        `);

        // Lấy số lượng góp ý chưa xử lý
        const [pendingSuggestions] = await connection.promise().query(`
            SELECT COUNT(*) as count 
            FROM suggestions 
            WHERE status = 'Chưa xử lý'
        `);

        console.log('Stats fetched:', newsStats[0]);
        console.log('Recent news count:', recentNews.length);

        res.render('admin/admin.ejs', {
            user: req.session.user,
            stats: {
                total: newsStats[0].total || 0,
                active: newsStats[0].active || 0,
                inactive: newsStats[0].inactive || 0,
                categories: categoryCount[0].count || 0,
                tournaments: tournamentCount[0].count || 0,
                pendingSuggestions: pendingSuggestions[0].count || 0
            },
            recentNews: recentNews
        });

    } catch (error) {
        console.error('Error in adminHome:', error);
        res.render('admin/admin.ejs', {
            user: req.session.user,
            stats: {
                total: 0,
                active: 0,
                inactive: 0,
                categories: 0,
                tournaments: 0,
                pendingSuggestions: 0
            },
            recentNews: [],
            error: 'Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
        });
    }
};

// Quản lý bài báo
exports.manageNews = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        // Get filter parameters
        const categoryId = req.query.category;
        const searchTerm = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Fetch categories
        const [categories] = await connection.promise().query('SELECT * FROM categories ORDER BY name');

        // Build the base query
        let query = `
            SELECT n.*, c.name as categoryName 
            FROM news n 
            LEFT JOIN categories c ON n.category_id = c.id 
            WHERE 1=1
        `;
        let countQuery = `
            SELECT COUNT(*) as total
            FROM news n 
            LEFT JOIN categories c ON n.category_id = c.id 
            WHERE 1=1
        `;
        const queryParams = [];

        // Add category filter if specified
        if (categoryId) {
            query += ' AND n.category_id = ?';
            countQuery += ' AND n.category_id = ?';
            queryParams.push(categoryId);
        }

        // Add search filter if specified
        if (searchTerm) {
            query += ' AND (n.title LIKE ? OR n.description LIKE ?)';
            countQuery += ' AND (n.title LIKE ? OR n.description LIKE ?)';
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        // Add ordering
        query += ' ORDER BY n.date DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Execute queries
        const [news] = await connection.promise().query(query, queryParams);
        const [countResult] = await connection.promise().query(countQuery, queryParams.slice(0, -2));
        const totalNews = countResult[0].total;
        const totalPages = Math.ceil(totalNews / limit);

        // Render the page
        res.render('admin/news-management.ejs', {
            user: req.session.user,
            news: news,
            categories: categories,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: categoryId,
            searchTerm: searchTerm,
            error: null
        });
    } catch (error) {
        console.error('Error in manageNews:', error);
        res.render('admin/news-management.ejs', {
            user: req.session.user,
            news: [],
            categories: [],
            currentPage: 1,
            totalPages: 1,
            selectedCategory: '',
            searchTerm: '',
            error: 'Có lỗi khi tải dữ liệu tin tức'
        });
    }
};

// Quản lý danh mục
exports.manageCategories = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const [categories] = await connection.promise().query('SELECT * FROM categories ORDER BY name');

        res.render('admin/category-management.ejs', {
            user: req.session.user,
            categories: categories,
            error: null
        });
    } catch (error) {
        console.error('Error in manageCategories:', error);
        res.render('admin/categories.ejs', {
            user: req.session.user,
            categories: [],
            error: 'Có lỗi khi tải dữ liệu danh mục'
        });
    }
};

// Quản lý giải đấu
exports.manageTournaments = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const [tournaments] = await connection.promise().query('SELECT * FROM tournaments ORDER BY name');

        res.render('admin/tournament-management.ejs', {
            user: req.session.user,
            tournaments: tournaments,
            error: null
        });
    } catch (error) {
        console.error('Error in manageTournaments:', error);
        res.render('admin/tournaments.ejs', {
            user: req.session.user,
            tournaments: [],
            error: 'Có lỗi khi tải dữ liệu giải đấu'
        });
    }
};

// Quản lý người dùng
exports.manageUsers = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const [users] = await connection.promise().query('SELECT id, username, fullName, email, role, status FROM user ORDER BY username');

        res.render('admin/user-management.ejs', {
            user: req.session.user,
            users: users,
            error: null
        });
    } catch (error) {
        console.error('Error in manageUsers:', error);
        res.render('admin/users.ejs', {
            user: req.session.user,
            users: [],
            error: 'Có lỗi khi tải dữ liệu người dùng'
        });
    }
};

// Hồ sơ cá nhân
exports.showProfile = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const [userProfile] = await connection.promise().query(
            'SELECT id, username, fullName, email FROM user WHERE id = ?',
            [req.session.user.id]
        );

        res.render('admin/profile.ejs', {
            user: req.session.user,
            profile: userProfile[0],
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Error in showProfile:', error);
        res.render('admin/profile.ejs', {
            user: req.session.user,
            profile: null,
            error: 'Có lỗi khi tải thông tin hồ sơ',
            success: null
        });
    }
};

// Đăng xuất
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin/login');
    });
};

// Xóa tin tức
exports.deleteNews = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const newsId = req.params.id;
        
        // Kiểm tra xem tin tức có tồn tại không
        const [existingNews] = await connection.promise().query(
            'SELECT * FROM news WHERE id = ?',
            [newsId]
        );

        if (!existingNews || existingNews.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tin tức không tồn tại'
            });
        }

        // Bắt đầu transaction
        const conn = await connection.promise();
        await conn.beginTransaction();

        try {
            // Xóa các bản ghi liên quan trong saved_news trước
            await conn.query('DELETE FROM saved_news WHERE news_id = ?', [newsId]);
            
            // Sau đó xóa tin tức
            await conn.query('DELETE FROM news WHERE id = ?', [newsId]);
            
            // Commit transaction nếu mọi thứ OK
            await conn.commit();

            res.json({
                success: true,
                message: 'Xóa tin tức thành công'
            });

        } catch (err) {
            // Rollback nếu có lỗi
            await conn.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error in deleteNews:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi khi xóa tin tức'
        });
    }
};

// Hiển thị form chỉnh sửa tin tức
exports.showEditNews = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        console.log('Edit news request for ID:', req.params.id);

        const newsId = req.params.id;
        
        // Lấy thông tin tin tức cần sửa
        const [news] = await connection.promise().query(
            'SELECT * FROM news WHERE id = ?',
            [newsId]
        );

        console.log('Found news:', news[0]);

        // Lấy danh sách danh mục để hiển thị trong form
        const [categories] = await connection.promise().query(
            'SELECT * FROM categories ORDER BY name'
        );

        console.log('Categories count:', categories.length);

        if (!news || news.length === 0) {
            console.log('News not found');
            return res.redirect('/admin/news');
        }

        res.render('admin/edit-news.ejs', {
            user: req.session.user,
            news: news[0],
            categories: categories,
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error in showEditNews:', error);
        res.redirect('/admin/news');
    }
};

// Cập nhật tin tức
exports.updateNews = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        console.log('Update request body:', req.body);
        console.log('Update request files:', req.files);

        const newsId = req.params.id;
        const { title, description, content, category_id, status } = req.body;

        // Validate required fields
        if (!title || !description || !content || !category_id) {
            throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }

        // Xử lý ảnh
        let image = req.body.current_image;
        if (req.files && req.files.image) {
            const imageFile = req.files.image;
            const fileName = Date.now() + '-' + imageFile.name;
            const uploadPath = path.join(__dirname, '../public/uploads/', fileName);
            
            try {
                await imageFile.mv(uploadPath);
                image = '/uploads/' + fileName;
            } catch (err) {
                console.error('Error uploading file:', err);
                throw new Error('Không thể tải lên hình ảnh');
            }
        }

        // Cập nhật tin tức trong database
        await connection.promise().query(
            `UPDATE news SET 
                title = ?,
                description = ?,
                content = ?,
                image = ?,
                category_id = ?,
                status = ?
            WHERE id = ?`,
            [title, description, content, image, category_id, status || 'Đang hoạt động', newsId]
        );

        // Chuyển hướng về trang quản lý tin tức với thông báo thành công
        req.session.success = 'Cập nhật tin tức thành công!';
        res.redirect('/admin/news');

    } catch (error) {
        console.error('Error in updateNews:', error);
        
        // Lấy lại dữ liệu để hiển thị form
        const [categories] = await connection.promise().query(
            'SELECT * FROM categories ORDER BY name'
        );

        const [currentNews] = await connection.promise().query(
            'SELECT * FROM news WHERE id = ?',
            [req.params.id]
        );

        res.render('admin/edit-news.ejs', {
            user: req.session.user,
            news: currentNews[0],
            categories: categories,
            error: error.message || 'Có lỗi xảy ra khi cập nhật tin tức',
            success: null
        });
    }
};
