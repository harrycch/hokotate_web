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

router.get('/newest', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,"newest",null,"votable",offset]}).findAll().then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post){return post.convert(req);}),
			noNext: (posts.length<=0),
			nextLink: "newest"+"?page="+(parseInt(page)+1)
		});
	});
});

router.get('/popular', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,"popular",null,"votable",offset]}).findAll().then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post){return post.convert(req);}),
			noNext: (posts.length<=0),
			nextLink: "popular"+"?page="+(parseInt(page)+1)
		});
	});
});

router.get('/almost', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,"almost",null,"votable",offset]}).findAll().then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post){return post.convert(req);}),
			noNext: (posts.length<=0),
			nextLink: "almost"+"?page="+(parseInt(page)+1)
		});
	});
});

router.get('/new_results', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,"newest",null,"results",offset]}).findAll().then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post){return post.convert(req);}),
			noNext: (posts.length<=0),
			nextLink: "new_results"+"?page="+(parseInt(page)+1)
		});
	});
});

router.get('/pop_results', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,"popular",null,"results",offset]}).findAll().then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post){return post.convert(req);}),
			noNext: (posts.length<=0),
			nextLink: "pop_results"+"?page="+(parseInt(page)+1)
		});
	});
});

router.get('/category/:id', function(req, res, next) {
	var categoryId = req.params.id,
		page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,"popular",categoryId,"mixed",offset]}).findAll().then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post){return post.convert(req);}),
			noNext: (posts.length<=0),
			nextLink: "category/"+categoryId+"?page="+(parseInt(page)+1)
		});
	});
});

router.get('/search', function (req, res, next) {
	var page = req.query.page || 1,
		tags = req.query.tags.split(",") || [],
		offset = (page-1) * config.itemPerPage;

	var include = models.Post.getInclude(req,models),
        wheres = [],
        attributes = ['id','title','hoko','tate','hokoImg','tateImg','tags','expireAt','CategoryId','UserId','createdAt','hokoCount','tateCount','commentCount'],
        orderBy = [['createdAt','DESC'],[[{raw: 'hokoCount + tateCount DESC'}]]];

    for (var i = 0; i < tags.length; i++) {
		wheres.push(models.Sequelize.where(
	      models.Sequelize.fn("FIND_IN_SET", tags[i] , models.Sequelize.col("tags")),
	      {$gt:0}
	    ));
    };
    where = {$and: wheres};

    var query = {
      include: include,
      attributes: attributes,
      where: where,
      limit: config.itemPerPage,
      order: orderBy,
      offset: offset
    };

	models.Post.findAll(query).then(function(posts){
		res.render('more', { 
			posts: posts.map(function(post) {
				post = post.convert(req);
				if (moment(post.expireAt).isAfter()) {
					post.hokoCount = null;
					post.tateCount = null;
				};
				return post
			}),
			noNext: (posts.length<=0),
			nextLink: "search?tags="+tags.join(",")+"&page="+(parseInt(page)+1)
		});
	});

});

router.get('/liked', function (req,res,next) {
	var page = req.query.page || 1,
		offset = (page-1)*config.itemPerPage,
		limit = config.itemPerPage,
		attributes = ['id','title','hoko','tate','hokoImg','tateImg','hokoCount','tateCount','tags','expireAt','CategoryId','UserId','createdAt','commentCount'],
		include = models.Post.getInclude(req,models);

	if (!req.session.user) {
		res.status(204).send();
		return;
	};
	
	models.User.findById(req.session.user.id).then(function (user) {
		var orderBy = [[ {model:models.User,as:'Liker'}, models.LikerLiked, 'createdAt' , 'DESC']];

		user.getLiked({
			include: include,
			attributes: attributes,
			where: {},
			limit: limit,
			offset: offset,
			order: orderBy
		}).then(function (liked) {
			res.render('more', { 
				posts: liked.map(function (post) { return post.convert(req);}),
				noNext: (liked.length<=0),
				nextLink: "liked?page="+(parseInt(page)+1)
			});
		});
	});
});

router.get('/voted', function (req,res,next) {
	var page = req.query.page || 1,
		offset = (page-1)*config.itemPerPage,
		limit = config.itemPerPage,
		attributes = ['id','title','hoko','tate','hokoImg','tateImg','hokoCount','tateCount','tags','expireAt','CategoryId','UserId','createdAt','commentCount'],
		include = models.Post.getInclude(req,models);

	if (!req.session.user) {
		res.status(204).send();
		return;
	};
	
	models.User.findById(req.session.user.id).then(function (user) {
		var orderBy = [[ {model:models.User,as:'Voter'}, models.VoterVoted, 'createdAt' , 'DESC']];

		user.getVoted({
			include: include,
			attributes: attributes,
			where: {},
			limit: limit,
			offset: offset,
			order: orderBy
		}).then(function (voted) {
			res.render('more', { 
				posts: voted.map(function (post) { return post.convert(req);}),
				noNext: (voted.length<=0),
				nextLink: "voted?page="+(parseInt(page)+1)
			});
		});
	});
});

module.exports = router;
