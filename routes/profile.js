var express = require('express');
var router = express.Router();
var async = require('async');
var S = require('string');
var config = require("../core/config");
var security = require('../core/security');
var utils = require("../core/utils");
var moment = require('moment-timezone');
var models = require("../models");
var i18n = require("i18next");
var async = require('async');

router.post('/',security.isWebsiteLoggedIn, function (req,res,next) {
	var preferredName = req.body.preferredName || null,
		password = req.body.password || null,
		passwordNew = req.body.passwordNew || "",
		passwordNewConfirm = req.body.passwordNewConfirm || "";

	models.User.findById(req.session.user.id).then(function (user) {
		if (user) {
			user.preferredName = preferredName;
			if (password) {
				if (security.encryptPassword(passwordNew)==security.encryptPassword(passwordNewConfirm)) {
					if (utils.validatePassword(passwordNew)) {
						user.password = security.encryptPassword(passwordNew);
						user.save().then(function (user) {
							req.session.alert_message = i18n.t('ns.profile:profile.success');
							req.session.user = user;
							res.redirect('/profile');
						});
					}else{
						res.redirect('/profile?error=USR005');
					}
				}else{
					res.redirect('/profile?error=USR002');
				}
			}else{
				user.save().then(function (user) {
					req.session.user = user;
					res.redirect('/profile');
				})
			}
			
		}else{
			res.redirect('/profile?error=USR011');
		}
	});

});

router.get('/', security.isWebsiteLoggedIn, function(req, res, next) {
	var offset = 0,
		limit = config.itemPerPage,
		attributes = ['id','title','hoko','tate','hokoImg','tateImg','hokoCount','tateCount','tags','expireAt','CategoryId','UserId','createdAt','commentCount'],
		include = models.Post.getInclude(req,models),
		error = req.query.error || null;

	models.User.findById(req.session.user.id).then(function (user) {
		async.parallel({
	    	cats: function(callback){
			    models.Category.findAll({ raw: true }).then(function(cats){
			    	callback(null,cats);
			    });
	    	},
	    	voted: function (callback) {
	    		var orderBy = [[ {model:models.User,as:'Voter'}, models.VoterVoted, 'createdAt' , 'DESC']];

	    		user.getVoted({
					include: include,
					attributes: attributes,
					where: {},
					limit: limit,
					offset: offset,
					order: orderBy
				}).then(function (voted) {
					callback(null,voted.map(function (post) {return post.convert(req);}))
				});
	    	},
	    	liked: function (callback) {
	    		var orderBy = [[ {model:models.User,as:'Liker'}, models.LikerLiked, 'createdAt' , 'DESC']];

	    		user.getLiked({
					include: include,
					attributes: attributes,
					where: {},
					limit: limit,
					offset: offset,
					order: orderBy
				}).then(function (liked) {
					callback(null,liked.map(function (post) { return post.convert(req);}))
				});
	    	}
	    }, function(err, results){
	    	var cats = results.cats,
	    		voted = results.voted,
	    		liked = results.liked;
	    	res.render('profile', { 
				cats: cats,
				voted: voted,
				liked: liked,
				error: error && i18n.t('ns.server:error.'+error),
				startscript: 'controller/index'
			});
		});
	});
});

module.exports = router;