var express = require('express');
var router = express.Router();
var async = require('async');
var S = require('string');
var config = require("../../core/config");
var security = require('../../core/security');
var utils = require("../../core/utils");
var moment = require('moment-timezone');
var models = require("../../models");
var i18n = require("i18next");
var multer = require("multer");

// List
router.get('/list', function(req, res, next) {
	models.Category.findAll().then(function (cats) {
		res.json({
			categories: cats.map(function (cat) {
				return cat.get({plain:true});
			})
		});
	})
});

module.exports = router;