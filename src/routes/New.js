

const express = require('express')
const router = express.Router();
const newcontroller = require('../controller/Article.js');

router.get('/categorynews', newcontroller.showNewLogin);
router.get('/categorytournament', newcontroller.showNewtournament);
router.get('/details', newcontroller.showNewdetail);

module.exports= router
