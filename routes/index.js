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

/* GET home page. */
router.get('/:var(newest)?', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.scope({ method: ['list',req,models,"newest",null,"votable",offset]}).findAll().then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post){return post.convert(req);}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'newest?page=2'
			});
		});
	});
});

router.get('/popular', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.scope({ method: ['list',req,models,"popular",null,"votable",offset]}).findAll().then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post){return post.convert(req);}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'popular?page=2'
			});
		});
	});
});

router.get('/almost', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.scope({ method: ['list',req,models,"almost",null,"votable",offset]}).findAll().then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post){return post.convert(req);}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'almost?page=2'
			});
		});
	});
});

router.get('/new_results', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.scope({ method: ['list',req,models,"newest",null,"results",offset]}).findAll().then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post){return post.convert(req);}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'new_results?page=2'
			});
		});
	});
});

router.get('/pop_results', function(req, res, next) {
	var page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.scope({ method: ['list',req,models,"popular",null,"results",offset]}).findAll().then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post){return post.convert(req);}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'pop_results?page=2'
			});
		});
	});
});

router.get('/category/:id', function(req, res, next) {
	var categoryId = req.params.id,
		page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.scope({ method: ['list',req,models,"popular",categoryId,"mixed",offset]}).findAll().then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post){return post.convert(req);}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'category/'+categoryId+"?page=2"
			});
		});
	});
});

router.get('/search', function (req, res, next) {
	var tagsString = req.query.tags,
		tags = tagsString.split(",") || [],
		offset = 0;

	if (tagsString == "") {
		res.redirect("/");
		return;
	};

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

	models.Category.findAll({ raw: true }).then(function(cats){
		models.Post.findAll(query).then(function(posts){
			res.render('index', { 
				posts: posts.map(function(post) {
					post = post.convert(req);
					if (moment(post.expireAt).isAfter()) {
						post.hokoCount = null;
						post.tateCount = null;
					};
					return post
				}),
				cats: cats,
				startscript: 'controller/index',
				nextLink: 'search?page=2&tags='+tags.join(",")
			});
		});
	});

});

router.get('/details/:id', function (req,res,next) {
	var id = req.params.id,
		offset = 0;

	async.parallel({
    	post: function(callback){
		    models.Post.scope({ method: ['details',req,models,id]}).find().then(function (post) {
		    	callback(null,post);
		    });
    	},
    	comments: function (callback) {
    		models.Comment.scope({method:["byPost",req,models,id,offset]}).findAll().then(function (comments) {
    			callback(null,comments);
    		});
    	},
    	categories: function (callback) {
    		models.Category.findAll({raw:true}).then(function (categories) {
    			callback(null,categories);
    		});
    	},
    	hasNext: function (callback) {
    		models.Comment.hasNext(id, offset, function (hasNext) {
    			callback(null,hasNext);
    		});
    	}
    }, function(err, results){
    	var post = results.post,
    		comments = results.comments,
    		cats = results.categories,
    		hasNext = results.hasNext;

		res.render('post',
		{
			post: post && post.convert(req),
			comments: comments,
			cats: cats,
			hasNext: hasNext,
			startscript: 'controller/index'
		});
    });
});

module.exports = router;
