const express = require('express')
const router = express.Router();
const newController = require('../controller/Article.js');

router.get('/categorynews', newController.showcategorynews);
router.get('/categorytournament', newController.showcategorytournament);
router.get('/news-detail', newController.showNewdetail);
router.get('/event', newController.showevent);
router.get('/search', newController.searchNews);
router.get('/api/search-suggestions', newController.getSearchSuggestions);
router.get('/api/tournament-suggestions', newController.getTournamentSuggestions);

module.exports = router;
