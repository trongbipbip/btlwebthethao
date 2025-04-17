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

exports.showNewdetail = (req, res) => {
    res.render('news-detail', { 
        error: null,
        user: req.session.user || null 
    });
};

