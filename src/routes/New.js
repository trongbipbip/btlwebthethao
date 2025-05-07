const express = require('express')
const router = express.Router();
const newController = require('../controller/Article.js');

router.get('/categorynews', newController.showcategorynews);
router.get('/categorytournament', newController.showcategorytournament);
router.get('/category-tournaments', newController.showcategorytournament);
router.get('/news-detail.ejs', newController.showNewdetail);
router.get('/event.ejs', newController.showevent);
router.get('/saved-news', newController.showsavednews);

module.exports = router;
