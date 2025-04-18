const express = require('express')
const router = express.Router();
const newController = require('../controller/Article.js');

router.get('/categorynews', newController.showNewLogin);
router.get('/categorytournament', newController.showNewtournament);
router.get('/details', newController.showNewdetail);

module.exports = router;
