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
var fs = require("fs");

var postAttributes = ['id','title','hoko','tate','hokoImg','tateImg','hokoCount','tateCount','tags','expireAt','CategoryId','UserId','createdAt','commentCount'];

var convertPost = function (post,req) {
	return post.convert(req);
}

var convertPosts = function (posts,req) {
	return posts.map(function(post){return post.convert(req);});
}

// List
router.get('/list', function(req, res, next) {
	var orderType = req.query.orderType || "newest", // newest, popular, almost
		votable = req.query.votable || "mixed",	// mixed, votable, results
		categoryId = req.query.categoryId || null,
		page = req.query.page || 1,
		offset = (page-1) * config.itemPerPage;

	models.Post.scope({ method: ['list',req,models,orderType,categoryId,votable,offset]}).findAll().then(function (posts) {
		res.json({
			posts: convertPosts(posts,req)
		});
	})
});

// get details
router.get('/details/:id', function(req, res, next) {
	var id = req.params.id;
	
	var include = models.Post.getInclude(req,models);

	models.Post.scope({ method: ['details',req,models,id]}).find().then(function (post) {
		if (post!=null) {
			res.json({
				post: convertPost(post,req)
			})
		}else{
			utils.apiDataError("POS003",res);
		};
	})
});

// create
router.post('/', security.isApiLoggedIn, function (req,res,next) {
	var categoryId = req.body.categoryId || null,
		title = req.body.title || null,
		hoko = req.body.hoko || "",
		tate = req.body.tate || "",
		tags = req.body.tags || "",
		days = parseInt(req.body.days) || null,
		answer = req.body.answer || "",
		hokoImg = req.body.hokoImg || null,
		tateImg = req.body.tateImg || null;

	if (categoryId && title && hoko && tate) {
		days = days || 30;
		if (days<=0) {
			utils.apiDataError("POS002", res);
			return;
		};
		
		models.Category.findById(categoryId).then(function (category) {
			if (category!=null) {
				var user = req.session.user;
				models.User.findById(user.id).then(function (user) {
					if (user.isActivated) {
						models.Post.create({
							hoko: hoko,
							tate: tate,
							hokoImg: hokoImg,
							tateImg: tateImg,
							tags: tags,
							title: title,
							answer: answer,
							expireAt: moment().add(days, 'days').tz(config.moment.zeroTimeZone)
						}).then(function (post) {
							post.setUser(user);
							post.setCategory(category);
							post.save().then(function (post) {
								models.Post.scope({ method: ['details',req,models,post.id]}).find().then(function (post) {
									res.json({
										post: convertPost(post,req)
									})
								})
							})
						});
					}else{
						utils.apiDataError("USR007",res);
					}
				})
			}else{
				utils.apiDataError("POS001",res);
			};
		})
	}else{
		utils.apiDataError("SYS002",res);
	};
});

router.get('/mine', security.isApiLoggedIn, function (req,res,next) {
	var page = req.query.page || 1,
		user = req.session.user,
		offset = (page-1) * config.itemPerPage,
		limit = config.itemPerPage,
		attributes = postAttributes,
		conditions = {},
		// orderBy = [[ {raw:'VoterVoted.createdAt DESC'}]];
		orderBy = [[ {model:models.User,as:'User'}, 'createdAt' , 'DESC']];

	models.User.findById(user.id).then(function (user) {
		user.getPost({
			include: models.Post.getInclude(req,models),
			attributes: attributes,
			where: conditions,
			limit: limit,
			offset: offset,
			order: orderBy
		}).then(function (posts) {
			res.json({
				posts: convertPosts(posts,req).map(function (post) { return post; })
			});
		});
	})
})

// vote
router.post('/vote/:id', security.isApiLoggedIn ,function(req, res, next) {
	var id = req.params.id,
		vote = req.body.vote || null;	// "hoko" "tate" "none"

	if(vote!="hoko" && vote!="tate" && vote!="none"){
		utils.apiDataError("POS004", res);
		return;
	}

	models.Post.findById(id).then(function (post) {
		if (post!=null) {
			if (moment(post.expireAt).isAfter()) {
				var savePost = function (post) {
					switch(vote){
						case "hoko":
						post.hokoCount += 1;
						break;

						case "tate":
						post.tateCount += 1;
						break;

						case "none":
						break;

						default:
						break;
					}

					post.save().then(function (post) {
						models.Post.findOne({
							where: {id: id},
							attributes: postAttributes,
							include: models.Post.getInclude(req,models)
						}).then(function (post) {
							res.json({
								post: convertPost(post,req)
							})
						})
					})
				}

				var userId = req.session.user.id;
				models.User.findById(userId).then(function (user) {
					if (user) {
						user.getVoted({where:{id:post.id}}).then(function (voted) {
							if (voted[0]) {
								voted = voted[0]
								switch(voted.VoterVoted.vote){
									case "hoko":
									post.hokoCount -= 1;
									break;
									case "tate":
									post.tateCount -= 1;
									break;
									default:
									break;
								}

								if(vote=="none"){
									user.removeVoted(post).then(function () {
										savePost(post)
									})
								}else{
									voted.VoterVoted.vote = vote
									voted.VoterVoted.save().then(function(voterVoted){
										savePost(post)	
									})
								}
							}else{
								if(vote=="none"){
									savePost(post)
								}else{
									user.addVoted(post, { vote: vote }).then(function (voterVoted) {
										savePost(post);
									});	
								}
							}
						})
						
					}else{
						savePost(post);
					}
				});
			}else{
				utils.apiDataError("POS006",res)
			}
		}else{
			utils.apiDataError("POS003",res);
		};
	})
});

// voted posts
router.get('/voted', security.isApiLoggedIn, function(req, res, next) {
	var page = req.query.page || 1,

		user = req.session.user,
		offset = (page-1) * config.itemPerPage,
		limit = config.itemPerPage,
		attributes = postAttributes,
		conditions = {},
		// orderBy = [[ {raw:'VoterVoted.createdAt DESC'}]];
		orderBy = [[ {model:models.User,as:'Voter'}, models.VoterVoted, 'createdAt' , 'DESC']];

	models.User.findById(user.id).then(function (user) {
		user.getVoted({
			// include: [ {model:models.Category, attributes:['id','name_en-US','name_zh-HK']} ],
			include: models.Post.getInclude(req,models),
			attributes: attributes,
			where: conditions,
			limit: limit,
			offset: offset,
			order: orderBy
		}).then(function (posts) {
			res.json({
				posts: convertPosts(posts,req).map(function (post) { delete post.VoterVoted; return post; })
			});
		});
	})
	
});

// like
router.post('/like/:id', security.isApiLoggedIn ,function(req, res, next) {
	var id = req.params.id;

	models.Post.findById(id).then(function (post) {
		if (post!=null) {
			var user = req.session.user;

			models.User.findById(user.id).then(function (user) {
				post.hasLiker(user).then(function (isHas) {
					if (isHas) {
						user.removeLiked(post).then(function () {
							models.Post.findOne({
								where: {id: id},
								attributes: postAttributes,
								include: models.Post.getInclude(req,models)
							}).then(function (post) {
								res.json({
									post: convertPost(post,req)
								});
							});
						});
					}else{
						user.addLiked(post).then(function () {
							models.Post.findOne({
								where: {id: id},
								attributes: postAttributes,
								include: models.Post.getInclude(req,models)
							}).then(function (post) {
								res.json({
									post: convertPost(post,req)
								});
							});
						});
					}
				});
			})

			
		}else{
			utils.apiDataError("POS003",res);
		};
	})
});

// liked posts
router.get('/liked', security.isApiLoggedIn, function(req, res, next) {
	var page = req.query.page || 1,

		user = req.session.user,
		offset = (page-1) * config.itemPerPage,
		limit = config.itemPerPage,
		attributes = postAttributes,
		conditions = {},
		// orderBy = [[ {raw:'LikerLiked.createdAt DESC'}]];
		orderBy = [[ {model:models.User,as:'Liker'}, models.LikerLiked, 'createdAt' , 'DESC']];

	models.User.findById(user.id).then(function (user) {
		user.getLiked({
			// include: [ {model:models.Category, attributes:['id','name_en-US','name_zh-HK']} ],
			include: models.Post.getInclude(req,models),
			attributes: attributes,
			where: conditions,
			limit: limit,
			offset: offset,
			order: orderBy
		}).then(function (posts) {
			res.json({
				posts: convertPosts(posts,req).map(function (post) { delete post.LikerLiked; return post; })
			});
		});
	})
	
});

router.post('/upload', security.isApiLoggedIn, multer({
  dest: './public/uploads/user/',
  limits: {
    fieldNameSize: 100,
    files: 1,
    fileSize: 5*1024*1024 // in bytes (5MB)
  },
  rename: function (fieldname, filename) {
    return Date.now() + "-" + filename;
  },
  onFileUploadStart: function (file,req,res) {
    console.log(file.mimetype);
    if (utils.validateImage(file)) {
      console.log(file.originalname + ' is starting ...')
      return true;
    }else{
      utils.apiDataError("FIL001",res);
      return false;
    }
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path)
  },
  onFileSizeLimit: function (file) {
    console.log('Failed: ', file.originalname)
    fs.unlink('./' + file.path) // delete the partially written file
  },
  onError: function(error,next){
  	console.log("Error: ", error);
  	next(error);
  },
  changeDest: function(dest, req, res) {
    var dest = utils.getUploadPath(dest,req);
    var stat = null;

    try {
        // using fs.statSync; NOTE that fs.existsSync is now deprecated; fs.accessSync could be used but is only nodejs >= v0.12.0
        stat = fs.statSync(dest);
    } catch(err) {
        // for nested folders, look at npm package "mkdirp"
        fs.mkdirSync(dest);
    }

    if (stat && !stat.isDirectory()) {
        // Woh! This file/link/etc already exists, so isn't a directory. Can't save in it. Handle appropriately.
        throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
    }
    return dest;
  },
  onParseStart: function () {
  	console.log('Form parsing started at: ', new Date())
  },
  onParseEnd: function (req, next) {
  	console.log('Form parsing completed at: ', new Date());
  	// call the next middleware
	next();
	}
}), function(req,res,next){
	var files = req.files,
		image = files.image || null,
		result = {};
	console.log("upload image api");
	if(!res.headersSent){
		if(image==null){
			utils.apiDataError("FIL003",res);
			return;
		}else if (image.truncated) {
			utils.apiDataError("FIL002",res);
			return;
		}else {
			result.imagePath = image.name;
			res.json(result);
		}
	}else{
		console.log("headersSent");
	}
});

router.get('/search', function (req,res,next) {
	var tags = req.query.tags.split(",") || [],
		page = req.query.page || 1,
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
		res.json({ 
			posts: posts.map(function(post) {
				post = post.get({plain:true});
				if (moment(post.expireAt).isAfter()) {
					post.hokoCount = null;
					post.tateCount = null;
				};
				return post
			}),
		});
	});
});

router.post("/comment/:id", security.isApiLoggedIn, function (req,res,next) {
	var id=req.params.id,
		message = req.body.message;

	if (message) {
		async.parallel({
        	post: function(callback){
			    models.Post.scope({ method: ['details',req,models,id]}).find().then(function (post) {
			    	callback(null,post);
			    });
        	},
        	user: function (callback) {
        		models.User.findById(req.session.user.id).then(function (user) {
	        		callback(null,user);
	        	})
        	}
        }, function(err, results){
        	var post = results.post,
        		user = results.user;

        	if (post!=null) {
				models.Comment.create({
					message: message
				}).then(function (comment) {
					comment.setUser(user);
					comment.setPost(post);
					comment.save().then(function (comment) {
						async.parallel({
							post: function (callback) {
								post.commentCount = post.commentCount+1;
								post.save().then(function (post) {
									callback(null,post);
								});
							},
							comment: function (callback) {
								models.Comment.findOne({
									where: {id: comment.id},
									include: {model:models.User, as:'User',attributes:['id','username','preferredName']}
								}).then(function (comment) {
									callback(null,comment);
								});
							}
						},function (err,results) {
							res.json({
								comment: results.comment
							});
						});
					});
				});
			}else{
				utils.apiDataError("POS003",res);
			}
        });
	}else{
		utils.apiDataError("SYS002",res);
	};
});

router.get("/comment/:id", function (req,res,next) {
	var id = req.params.id,
		page = req.query.page || 1,
		offset = (page-1) * config.commentPerPage;

	async.parallel({
    	comments: function(callback){
		    models.Comment.scope({method:["byPost",req,models,id,offset]}).findAll().then(function  (comments) {
		    	callback(null,comments);
		    });
    	},
    	hasNext: function (callback) {
    		models.Comment.hasNext(id, offset, function (hasNext) {
    			callback(null,hasNext);
    		});
    	}
    }, function(err, results){
    	var comments = results.comments,
    		hasNext = results.hasNext;
	
		res.json({
			comments: comments,
			hasNext: hasNext
		});
	});
});

module.exports = router;
