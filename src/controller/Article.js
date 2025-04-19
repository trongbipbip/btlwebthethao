const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const viewConfig = require('../config/viewConfig.js'); 
const { connect } = require('../routes/Admin.js');


exports.showNewLogin = (req, res) => {
    res.render('category-news', { 
        error: null,
        user: req.session.user || null 
    });
};


exports.showHome = (req, res) => {
    res.render('index', { 
        error: null,
        user: req.session.user || null 
    });
};

exports.showcategorytournament = (req, res) => {
    res.render('category-tournament', {
        error: null,
        user: req.session.user || null
    });
};

exports.showcategorynews = async (req, res) => {
    try {
        // Lấy category id từ query parameter nếu có
        const categoryId = req.query.id;
        
        // Nếu có category id, lấy thông tin category đó
        if (categoryId) {
            connection.query(
                `SELECT * FROM categories WHERE id = ?`, 
                [categoryId], 
                (error, results) => {
                    if (error || results.length === 0) {
                        console.error("Lỗi truy vấn hoặc không tìm thấy danh mục", error);
                        return res.status(404).send('Danh mục không tồn tại');
                    }
                    
                    const category = results[0];
                    // Lấy các bài viết thuộc category này
                    connection.query(
                        `SELECT * FROM news WHERE category_id = ? ORDER BY date DESC`, 
                        [categoryId], 
                        (newsError, newsResults) => {
                            if (newsError) {
                                console.error("Lỗi truy vấn tin tức:", newsError);
                                return res.status(500).send('Lỗi server');
                            }
                            
                            return res.render('category-news', {
                                category: category,
                                articles: newsResults,
                                user: req.session.user || null
                            });
                        }
                    );
                }
            );
        } 
        // Nếu không có category id, lấy tất cả categories
        else {
            connection.query(
                `SELECT * FROM categories`, 
                [], 
                (error, results) => {
                    if (error) {
                        console.error("Lỗi truy vấn danh mục:", error);
                        return res.status(500).send('Lỗi server');
                    }
                    
                    // Lấy tất cả bài viết, sắp xếp theo ngày
                    connection.query(
                        `SELECT news.*, categories.name as category_name 
                         FROM news 
                         JOIN categories ON news.category_id = categories.id 
                         ORDER BY news.date DESC`,
                        [],
                        (newsError, newsResults) => {
                            if (newsError) {
                                console.error("Lỗi truy vấn tin tức:", newsError);
                                return res.status(500).send('Lỗi server');
                            }
                            
                            return res.render('category-news', {
                                categories: results,
                                articles: newsResults,
                                user: req.session.user || null
                            });
                        }
                    );
                }
            );
        }
    } catch (err) {
        console.error('Lỗi trong showcategorynews:', err);
        return res.status(500).send('Lỗi server');
    }
};

exports.showcategorytournament = (req, res) => {
    res.render('category-tournament', {
        error: null,
        user: req.session.user || null
    });
};

exports.showsavednews = (req, res) => {
    res.render('saved-news', {
        error: null,
        user: req.session.user || null
    });
};

exports.showNewdetail = async (req, res) => {
    try {
        const articleId = req.query.id;
        
        if (!articleId) {
            console.error("Không có ID bài viết");
            return res.status(400).send('Thiếu ID bài viết');
        }

        console.log("Đang tìm bài viết với ID:", articleId);

        // Cập nhật lượt xem
        connection.query('UPDATE news SET views = views + 1 WHERE id = ?', [articleId], (updateError) => {
            if (updateError) {
                console.error("Lỗi cập nhật lượt xem:", updateError);
                // Tiếp tục xử lý để hiển thị bài viết ngay cả khi không cập nhật được lượt xem
            }
            
            // Đảm bảo lấy toàn bộ nội dung không bị cắt ngắn
            connection.query(
                'SELECT * FROM news WHERE id = ?', 
                [articleId], 
                (error, results) => {
                    if (error) {
                        console.error("Lỗi truy vấn database:", error);
                        return res.status(500).send('Lỗi khi truy vấn database');
                    }
                    
                    if (results.length === 0) {
                        console.error("Không tìm thấy bài viết với ID:", articleId);
                        return res.status(404).send('Bài viết không tồn tại');
                    }
                    
                    const article = results[0];
                    console.log("Đã tìm thấy bài viết:", article.title);
                    console.log("Độ dài nội dung:", article.content ? article.content.length : 0);
                    
                    // Lấy thông tin category (nếu cần)
                    connection.query(
                        'SELECT name FROM categories WHERE id = ?',
                        [article.category_id],
                        (catError, catResults) => {
                            if (!catError && catResults.length > 0) {
                                article.category_name = catResults[0].name;
                            } else {
                                article.category_name = 'Chưa phân loại';
                            }
                            
                            // Log để kiểm tra nội dung trước khi render
                            console.log("Rendering article with content length:", article.content ? article.content.length : 0);
                            
                            // Render trang với dữ liệu bài viết
                            return res.render('news-detail', {
                                article: article,
                                user: req.session.user || null
                            });
                        }
                    );
                }
            );
        });
    } catch (err) {
        console.error("Lỗi trong showNewdetail:", err);
        return res.status(500).send('Lỗi server');
    }
};


exports.showevent = async (req, res) => {
    try {
        const eventId = req.query.id;
        
        if (!eventId) {
            console.error("Không có ID giải đấu");
            return res.status(400).send('Thiếu ID giải đấu');
        }

        console.log("Đang tìm giải đấu với ID:", eventId);
        
        // Truy vấn bảng tournaments với tên bảng đã được sửa
        connection.query(
            'SELECT * FROM tournaments WHERE id = ?',
            [eventId],
            (error, results) => {
                if (error) {
                    console.error('Lỗi truy vấn database:', error);
                    return res.status(500).send('Lỗi khi truy vấn database');
                }
                
                if (results.length === 0) {
                    console.error('Không tìm thấy giải đấu với ID:', eventId);
                    return res.status(404).send('Giải đấu không tồn tại');
                }
                
                const event = results[0];
                console.log("Đã tìm thấy giải đấu:", event.name || event.title);
                
                // Render template event.ejs với dữ liệu giải đấu
                return res.render('event', {
                    event: event,
                    user: req.session.user || null
                });
            }
        );
    } catch (err) {
        console.error('Lỗi trong showevent:', err);
        return res.status(500).send('Lỗi server');
    }
};


exports.showsavednews = (req, res) => {
    res.render('saved-news', {
        error: null,
        user: req.session.user || null
    });
};
