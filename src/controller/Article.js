const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const connection = require('../config/connection.js');
const viewConfig = require('../config/viewConfig.js'); 


exports.showNewLogin = (req, res) => {
    res.render('category-news', { 
        error: null,
        user: req.session.user || null 
    });
};

exports.showNewtournament = (req, res) => {
    res.render('category-tournament', { 
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

exports.showcategorynews = (req, res) => {
    res.render('category-news', {
        error: null,
        user: req.session.user || null
    });
};

exports.showNewdetail = async (req, res) => {
    try {
        const articleId = req.query.id;

        // Khôi phục phần truy vấn database
        connection.query('UPDATE news SET views = views + 1 WHERE id = ?', [articleId]);

        connection.query(`SELECT news.*, categories.name as category_name
            FROM news 
            JOIN categories 
            ON news.category_id = categories.id 
            WHERE news.id = ?`, 
            [articleId], (error, results) => {
            if (error || results.length === 0) {
                console.error("Lỗi truy vấn hoặc không tìm thấy bài viết:", error);
                return res.status(404).send('Bài viết không tồn tại');
            }
            const article = results[0];
            return res.render('news-detail', {
                article: article,
                user: req.session.user || null
            });
        });

    } catch (err) {
        console.error("Lỗi trong showNewdetail:", err);
        return res.status(500).send('Lỗi server');
    }
};

exports.showevent = (req, res) => {
    res.render('event', {
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
