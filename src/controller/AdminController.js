const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const session = require('express-session');
const viewConfig = require('../config/viewConfig.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

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

        // Lấy danh sách danh mục và đếm số bài viết trong mỗi danh mục
        const [categories] = await connection.promise().query(`
            SELECT 
                c.id,
                c.name,
                COUNT(DISTINCT n.id) as count
            FROM categories c
            LEFT JOIN news n ON c.id = n.category_id AND n.status != 'Đã xóa'
            GROUP BY c.id, c.name
            ORDER BY c.name
        `);

        console.log('Categories with counts:', categories);

        res.render('admin/category-management', {
            user: req.session.user,
            categories: categories,
            error: null
        });
    } catch (error) {
        console.error('Error in manageCategories:', error);
        res.render('admin/category-management', {
            user: req.session.user,
            categories: [],
            error: 'Có lỗi khi tải dữ liệu danh mục'
        });
    }
};

// Quản lý giải đấu
exports.manageTournaments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Query để lấy tổng số giải đấu
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM tournaments 
            WHERE name LIKE ? OR location LIKE ?
        `;
        const searchPattern = `%${search}%`;
        const [countResult] = await connection.promise().query(countQuery, [searchPattern, searchPattern]);
        const total = countResult[0].total;

        // Query để lấy danh sách giải đấu có phân trang
        const query = `
            SELECT id, name, image, more, location, surface, status, prize 
            FROM tournaments 
            WHERE name LIKE ? OR location LIKE ?
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `;
        
        const [tournaments] = await connection.promise().query(query, [searchPattern, searchPattern, limit, offset]);

        res.render('admin/tournament-management', {
            user: req.session.user,
            tournaments,
            search,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error in manageTournaments:', error);
        res.render('admin/tournament-management', {
            user: req.session.user,
            tournaments: [],
            message: {
                type: 'danger',
                text: 'Có lỗi xảy ra khi tải danh sách giải đấu'
            }
        });
    }
};

// Quản lý người dùng
exports.manageUsers = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';
        const selectedStatus = req.query.status || '';

        // Build query conditions
        let conditions = [];
        let params = [];
        
        // Always filter for all users (both admin and non-admin) but will display only user role in template
        conditions.push('1=1');
        
        // Add search conditions if provided
        if (searchTerm) {
            conditions.push('(username LIKE ? OR fullName LIKE ? OR email LIKE ?)');
            params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }
        
        // Add status filter if provided
        if (selectedStatus) {
            conditions.push('status = ?');
            params.push(selectedStatus);
        }
        
        // Create the WHERE clause
        const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        
        // Count total users matching the criteria
        const [countResult] = await connection.promise().query(
            `SELECT COUNT(*) as total FROM user ${whereClause}`,
            params
        );
        const totalUsers = countResult[0].total;
        const totalPages = Math.ceil(totalUsers / limit);
        
        // Get paginated users
        const query = `
            SELECT id, username, fullName, email, role, status 
            FROM user 
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;
        
        const [users] = await connection.promise().query(
            query,
            [...params, limit, offset]
        );

        res.render('admin/user-management.ejs', {
            user: req.session.user,
            users: users,
            currentPage: page,
            totalPages: totalPages,
            searchTerm: searchTerm,
            selectedStatus: selectedStatus,
            error: null,
            req: req
        });
    } catch (error) {
        console.error('Error in manageUsers:', error);
        res.render('admin/user-management.ejs', {
            user: req.session.user,
            users: [],
            currentPage: 1,
            totalPages: 1,
            searchTerm: '',
            selectedStatus: '',
            error: 'Có lỗi khi tải dữ liệu người dùng',
            req: req
        });
    }
};

// Đổi trạng thái người dùng (kích hoạt/vô hiệu hóa)
exports.toggleUserStatus = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const userId = req.params.id;
        
        // Kiểm tra người dùng có tồn tại không
        const [user] = await connection.promise().query(
            'SELECT * FROM user WHERE id = ?',
            [userId]
        );
        
        if (!user || user.length === 0) {
            req.session.error = 'Người dùng không tồn tại';
            return res.redirect('/admin/users');
        }
        
        // Không cho phép admin vô hiệu hóa chính mình
        if (user[0].id === req.session.user.id) {
            req.session.error = 'Không thể thay đổi trạng thái của chính bạn';
            return res.redirect('/admin/users');
        }
        
        // Đảo ngược trạng thái
        const newStatus = user[0].status === 'active' ? 'inactive' : 'active';
        
        // Cập nhật trạng thái trong database
        await connection.promise().query(
            'UPDATE user SET status = ? WHERE id = ?',
            [newStatus, userId]
        );
        
        // Quay lại trang quản lý người dùng với thông báo thành công
        req.session.success = `Trạng thái người dùng đã được thay đổi thành ${newStatus === 'active' ? 'Đang hoạt động' : 'Bị khóa'}`;
        res.redirect('/admin/users');
        
    } catch (error) {
        console.error('Error in toggleUserStatus:', error);
        req.session.error = 'Có lỗi khi thay đổi trạng thái người dùng';
        res.redirect('/admin/users');
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const userId = req.params.id;
        
        // Kiểm tra người dùng có tồn tại không
        const [user] = await connection.promise().query(
            'SELECT * FROM user WHERE id = ?',
            [userId]
        );
        
        if (!user || user.length === 0) {
            req.session.error = 'Người dùng không tồn tại';
            return res.redirect('/admin/users');
        }
        
        // Không cho phép admin xóa chính mình
        if (user[0].id === req.session.user.id) {
            req.session.error = 'Không thể xóa tài khoản của chính bạn';
            return res.redirect('/admin/users');
        }
        
        // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        const conn = await connection.promise();
        await conn.beginTransaction();
        
        try {
            // Xóa các bản ghi liên quan trước
            await conn.query('DELETE FROM saved_news WHERE user_id = ?', [userId]);
            await conn.query('DELETE FROM suggestions WHERE user_id = ?', [userId]);
            
            // Cuối cùng xóa người dùng
            await conn.query('DELETE FROM user WHERE id = ?', [userId]);
            
            // Commit nếu mọi thứ OK
            await conn.commit();
            
            req.session.success = 'Xóa người dùng thành công';
            res.redirect('/admin/users');
            
        } catch (err) {
            // Rollback nếu có lỗi
            await conn.rollback();
            throw err;
        }
        
    } catch (error) {
        console.error('Error in deleteUser:', error);
        req.session.error = 'Có lỗi khi xóa người dùng, người dùng có thể có dữ liệu liên kết';
        res.redirect('/admin/users');
    }
};

// Hồ sơ cá nhân
exports.showProfile = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const [userProfile] = await connection.promise().query(
            'SELECT id, username, fullName, email, avatar FROM user WHERE id = ?',
            [req.session.user.id]
        );

        res.render('admin/profile.ejs', {
            user: req.session.user,
            profile: userProfile[0],
            error: req.session.error || null,
            success: req.session.success || null
        });
        
        // Clear flash messages
        req.session.error = null;
        req.session.success = null;
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

// Hiển thị form tạo tin tức mới
exports.showCreateNews = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        // Lấy danh sách danh mục để hiển thị trong form
        const [categories] = await connection.promise().query(
            'SELECT * FROM categories ORDER BY name'
        );

        res.render('admin/create-news', {
            user: req.session.user,
            categories: categories,
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error in showCreateNews:', error);
        res.render('admin/create-news', {
            user: req.session.user,
            categories: [],
            error: 'Có lỗi khi tải trang tạo tin tức',
            success: null
        });
    }
};

// Xử lý tạo tin tức mới
exports.createNews = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        console.log('Create news request body:', req.body);
        console.log('Create news request files:', req.files);

        const { title, description, content, category_id, status } = req.body;

        // Validate required fields
        if (!title || !description || !content || !category_id) {
            throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }

        // Xử lý upload ảnh
        let image = null;
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
        } else {
            throw new Error('Vui lòng chọn hình ảnh');
        }

        // Thêm tin tức mới vào database
        const [result] = await connection.promise().query(
            `INSERT INTO news (title, description, content, image, category_id, status, date) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [title, description, content, image, category_id, status || 'Đang hoạt động']
        );

        console.log('News created successfully:', result);

        // Chuyển hướng về trang quản lý tin tức với thông báo thành công
        req.session.success = 'Tạo tin tức mới thành công!';
        res.redirect('/admin/news');

    } catch (error) {
        console.error('Error in createNews:', error);
        
        // Lấy lại danh sách danh mục để hiển thị form
        const [categories] = await connection.promise().query(
            'SELECT * FROM categories ORDER BY name'
        );

        res.render('admin/create-news', {
            user: req.session.user,
            categories: categories,
            error: error.message || 'Có lỗi xảy ra khi tạo tin tức mới',
            success: null
        });
    }
};

// Hiển thị form tạo danh mục mới
exports.showCreateCategory = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        res.render('admin/create-category', {
            user: req.session.user,
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error in showCreateCategory:', error);
        res.render('admin/create-category', {
            user: req.session.user,
            error: 'Có lỗi khi tải trang tạo danh mục',
            success: null
        });
    }
};

// Xử lý tạo danh mục mới
exports.createCategory = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const { name } = req.body;

        // Validate
        if (!name || name.trim() === '') {
            return res.render('admin/create-category', {
                user: req.session.user,
                error: 'Vui lòng nhập tên danh mục',
                success: null
            });
        }

        // Kiểm tra danh mục đã tồn tại chưa
        const [existingCategory] = await connection.promise().query(
            'SELECT * FROM categories WHERE name = ?',
            [name]
        );

        if (existingCategory.length > 0) {
            return res.render('admin/create-category', {
                user: req.session.user,
                error: 'Danh mục này đã tồn tại',
                success: null
            });
        }

        // Thêm danh mục mới
        const [result] = await connection.promise().query(
            'INSERT INTO categories (name) VALUES (?)',
            [name]
        );

        if (result.affectedRows > 0) {
            req.session.success = 'Tạo danh mục thành công!';
            res.redirect('/admin/categories');
        } else {
            throw new Error('Không thể tạo danh mục');
        }

    } catch (error) {
        console.error('Error in createCategory:', error);
        res.render('admin/create-category', {
            user: req.session.user,
            error: 'Có lỗi khi tạo danh mục mới',
            success: null
        });
    }
};

// Hiển thị form tạo giải đấu mới
exports.showCreateTournament = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        res.render('admin/create-tournament', {
            user: req.session.user,
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error in showCreateTournament:', error);
        res.render('admin/create-tournament', {
            user: req.session.user,
            error: 'Có lỗi khi tải trang tạo giải đấu',
            success: null
        });
    }
};

// Xử lý tạo giải đấu mới
exports.createTournament = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const { name, location, surface, prize, status, more } = req.body;

        // Validate required fields
        if (!name || !location || !surface || !prize) {
            throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }

        // Xử lý upload ảnh
        let image = null;
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

        // Thêm giải đấu mới vào database
        const [result] = await connection.promise().query(
            `INSERT INTO tournaments (name, location, surface, prize, status, more, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, location, surface, prize, status || 'Đang hoạt động', more || '', image]
        );

        console.log('Tournament created successfully:', result);

        // Chuyển hướng về trang quản lý giải đấu với thông báo thành công
        req.session.success = 'Tạo giải đấu mới thành công!';
        res.redirect('/admin/tournaments');

    } catch (error) {
        console.error('Error in createTournament:', error);
        res.render('admin/create-tournament', {
            user: req.session.user,
            error: error.message || 'Có lỗi xảy ra khi tạo giải đấu mới',
            success: null
        });
    }
};

// Hiển thị form chỉnh sửa giải đấu
exports.showEditTournament = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const tournamentId = req.params.id;
        
        // Lấy thông tin giải đấu cần sửa
        const [tournament] = await connection.promise().query(
            'SELECT * FROM tournaments WHERE id = ?',
            [tournamentId]
        );

        if (!tournament || tournament.length === 0) {
            return res.redirect('/admin/tournaments');
        }

        res.render('admin/edit-tournament', {
            user: req.session.user,
            tournament: tournament[0],
            error: null,
            success: null
        });

    } catch (error) {
        console.error('Error in showEditTournament:', error);
        res.redirect('/admin/tournaments');
    }
};

// Cập nhật giải đấu
exports.updateTournament = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        const tournamentId = req.params.id;
        const { name, location, surface, prize, status, more } = req.body;

        // Validate required fields
        if (!name || !location || !surface || !prize) {
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

        // Cập nhật giải đấu trong database
        await connection.promise().query(
            `UPDATE tournaments SET 
                name = ?,
                location = ?,
                surface = ?,
                prize = ?,
                status = ?,
                more = ?,
                image = ?
            WHERE id = ?`,
            [name, location, surface, prize, status || 'Đang hoạt động', more || '', image, tournamentId]
        );

        // Chuyển hướng về trang quản lý giải đấu với thông báo thành công
        req.session.success = 'Cập nhật giải đấu thành công!';
        res.redirect('/admin/tournaments');

    } catch (error) {
        console.error('Error in updateTournament:', error);
        
        const [tournament] = await connection.promise().query(
            'SELECT * FROM tournaments WHERE id = ?',
            [req.params.id]
        );

        res.render('admin/edit-tournament', {
            user: req.session.user,
            tournament: tournament[0],
            error: error.message || 'Có lỗi xảy ra khi cập nhật giải đấu',
            success: null
        });
    }
};

// Xóa giải đấu
exports.deleteTournament = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const tournamentId = req.params.id;
        
        // Kiểm tra xem giải đấu có tồn tại không
        const [existingTournament] = await connection.promise().query(
            'SELECT * FROM tournaments WHERE id = ?',
            [tournamentId]
        );

        if (!existingTournament || existingTournament.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Giải đấu không tồn tại'
            });
        }

        // Xóa giải đấu
        await connection.promise().query('DELETE FROM tournaments WHERE id = ?', [tournamentId]);

        res.redirect('/admin/tournaments');

    } catch (error) {
        console.error('Error in deleteTournament:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi khi xóa giải đấu'
        });
    }
};

// Quản lý góp ý
exports.manageSuggestions = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        // Lấy danh sách góp ý từ người dùng
        const [suggestions] = await connection.promise().query(`
            SELECT s.*, u.username, u.fullName 
            FROM suggestions s
            LEFT JOIN user u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);

        res.render('admin/suggestion', {
            user: req.session.user,
            suggestions: suggestions,
            error: null
        });
    } catch (error) {
        console.error('Error in manageSuggestions:', error);
        res.render('admin/suggestion', {
            user: req.session.user,
            suggestions: [],
            error: 'Có lỗi khi tải dữ liệu góp ý'
        });
    }
};

// Cập nhật avatar
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }
        
        if (!req.files || !req.files.avatar) {
            req.session.error = 'Vui lòng chọn ảnh để tải lên';
            return res.redirect('/admin/profile');
        }

        const avatarFile = req.files.avatar;
        const fileName = Date.now() + '-' + avatarFile.name;
        const uploadPath = path.join(__dirname, '../public/uploads/avatars/', fileName);
        
        // Đảm bảo thư mục tồn tại
        const avatarDir = path.join(__dirname, '../public/uploads/avatars/');
        if (!fs.existsSync(avatarDir)) {
            fs.mkdirSync(avatarDir, { recursive: true });
        }
        
        try {
            await avatarFile.mv(uploadPath);
            
            // Cập nhật đường dẫn avatar trong database
            await connection.promise().query(
                'UPDATE user SET avatar = ? WHERE id = ?',
                ['/uploads/avatars/' + fileName, req.session.user.id]
            );
            
            // Cập nhật avatar trong session
            req.session.user.avatar = '/uploads/avatars/' + fileName;
            
            req.session.success = 'Cập nhật ảnh đại diện thành công';
            res.redirect('/admin/profile');
            
        } catch (err) {
            console.error('Error uploading file:', err);
            req.session.error = 'Không thể tải lên hình ảnh';
            res.redirect('/admin/profile');
        }
        
    } catch (error) {
        console.error('Error in updateAvatar:', error);
        req.session.error = 'Có lỗi khi cập nhật ảnh đại diện';
        res.redirect('/admin/profile');
    }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }
        
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            req.session.error = 'Vui lòng điền đầy đủ thông tin';
            return res.redirect('/admin/profile');
        }
        
        // Lấy thông tin người dùng từ database
        const [user] = await connection.promise().query(
            'SELECT * FROM user WHERE id = ?',
            [req.session.user.id]
        );
        
        if (!user || user.length === 0) {
            req.session.error = 'Không tìm thấy thông tin người dùng';
            return res.redirect('/admin/profile');
        }
        
        // Kiểm tra mật khẩu hiện tại
        const passwordMatch = await bcrypt.compare(currentPassword, user[0].password);
        
        if (!passwordMatch) {
            req.session.error = 'Mật khẩu hiện tại không chính xác';
            return res.redirect('/admin/profile');
        }
        
        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Cập nhật mật khẩu mới trong database
        await connection.promise().query(
            'UPDATE user SET password = ? WHERE id = ?',
            [hashedPassword, req.session.user.id]
        );
        
        req.session.success = 'Đổi mật khẩu thành công';
        res.redirect('/admin/profile');
        
    } catch (error) {
        console.error('Error in changePassword:', error);
        req.session.error = 'Có lỗi khi đổi mật khẩu';
        res.redirect('/admin/profile');
    }
};
