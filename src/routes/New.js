const express = require('express')
const router = express.Router();
const newController = require('../controller/Article.js');

router.get('/categorynews', newController.showcategorynews);
router.get('/categorytournament', newController.showcategorytournament);
router.get('/category-tournament.ejs', newController.showcategorytournament);
router.get('/details', newController.showNewdetail);
router.get('/news-detail.ejs', newController.showNewdetail);
router.get('/event', newController.showevent);
router.get('/event.ejs', newController.showevent);
router.get('/saved-news', newController.showsavednews);

module.exports = router;
