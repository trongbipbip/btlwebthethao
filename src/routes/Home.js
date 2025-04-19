const express = require('express')
const router = express.Router();
const newcontroller = require('../controller/Article.js');

// Thêm route cho đường dẫn gốc
router.get('/', newcontroller.showHome);
router.get('/home', newcontroller.showHome);

module.exports= router