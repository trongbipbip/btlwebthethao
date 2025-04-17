const express = require('express')
const router = express.Router();
const newcontroller = require('../controller/Article.js');
router.get('/home', newcontroller.showHome);

module.exports= router