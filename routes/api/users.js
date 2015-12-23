var express = require('express');
var router = express.Router();
var async = require('async');
var S = require('string');
var config = require("../../core/config");
var security = require('../../core/security');
var utils = require("../../core/utils");
var models = require("../../models");
var moment = require('moment-timezone');
var md5 = require('MD5');
var crypto = require('crypto');

router.post('/register', function(req, res) {
	var username = req.body.username || null,
		password = req.body.password || null,
		passwordConfirm = req.body.passwordConfirm || null,
		preferredName = req.body.preferredName || null;

	if (username!=null && passwordConfirm!=null && password!=null && preferredName!=null) {
		if (utils.validateEmail(username)) {
			// Check with password
			if (security.encryptPassword(password)==security.encryptPassword(passwordConfirm)) {
				if (utils.validatePassword(password)) {
					models.User.findOne({where: {username:username}}).then(function (user) {
						// check username
						if (user==null) {
							models.User.create({
								username: username,
								password: security.encryptPassword(password),
								preferredName: preferredName,
								token: crypto.createHash('sha256').update(username).digest('hex')
							}).then(function (user) {
								security.sendConfirmationEmail(user, req, function (err, info) {
								});
								req.session.user = user;
								res.json({
									user: user.get({plain:true})
								});
							});
						}else{
							utils.apiDataError("USR003",res);
						}
					});
				}else{
					utils.apiDataError("USR005",res);
				}
			}else{
				utils.apiDataError("USR002",res);
			};
		}else{
			utils.apiDataError("USR006",res);
		}
		
	}else{
		utils.apiDataError("SYS002",res);
	};
});

router.post('/login', function (req,res) {
	var username = req.body.username || null,
		password = req.body.password || "";

	if (username!=null) {
		models.User.findOne({where: {username:username, password:security.encryptPassword(password)}}).then(function (user) {
			if (user==null) {
				utils.apiDataError("USR001", res);
			}else{
				req.session.user = user;
				res.json({
					user: user.get({plain:true})
				});
			};
		});
	}else{
		utils.apiDataError("SYS002", res);
	};
});

router.post('/logout', function (req,res) {
	req.session.user = null;
	res.status(204).send();
});

router.post('/update', security.isApiLoggedIn, function (req,res) {
	var preferredName = req.body.preferredName || null,
		user = req.session.user;

	if(preferredName!=null){
		models.User.findById(user.id).then(function (user) {
			if (preferredName) {
				user.preferredName = preferredName	
			};

			user.save().then(function (user) {
				req.session.user = user;
				res.json({
					user: user.get({plain:true})
				});
			});
		})
	}else{
		utils.apiDataError("SYS002",res)
	}
	
});

router.get('/', security.isApiLoggedIn, function (req,res) {
	var user = req.session.user;
	models.User.findById(user.id).then(function (user) {
		res.json({
			user: user
		});	
	})
});

router.post('/email/resend', security.isApiLoggedIn, function (req,res) {
	var user = req.session.user;
	security.sendConfirmationEmail(user, req,function (err,info) {
		if (err) {
			utils.apiDataError("USR008",res);
		}else{
			res.json({
				info: info.response
			});
		}
	});
});

router.post('/connect', function (req,res) {
	var network = req.body.network || null,
		userId = req.body.userId || null,
		accessToken = req.body.accessToken || null,
		email = req.body.email || null,
		preferredName = req.body.preferredName || null,
		type = req.body.type || "connect",
		where = {};

	switch(network){
		case "facebook":
		where.facebookId = userId;
		// where.facebookAccessToken = accessToken;
		break;

		case "google":
		where.googleplusId = userId;
		// where.googleplusAccessToken = accessToken;
		break;

		default:
		utils.apiDataError("SYS002",res);
		break;
	}

	if (type=="connect") {
		if (network && userId && accessToken) {
			if (req.session.user) {
				models.User.findOne({where:where}).then(function (user) {
					if (user) {		// if found user with such id,accessToken
						if(req.session.user.id == user.id){
							models.User.findById(req.session.user.id).then(function (user) {
								user.setAccessToken(network,accessToken, function (user) {
									req.session.user = user;
									res.json({
										user: user.get({plain:true})
									});
								});
							});
							res.json({
								user: user.get({plain:true})
							});	
						}else{
							utils.apiDataError("USR010",res);
						}
					}else{
						models.User.findById(req.session.user.id).then(function (user) {
							user.setUserIdAccessToken(network,userId,accessToken, function (user) {
								req.session.user = user;
								res.json({
									user: user.get({plain:true})
								});
							});
						});
					}
				});
			}else{
				models.User.findOne({where:where}).then(function (user) {
					if (user) {
						user.setAccessToken(network,accessToken, function (user) {
							req.session.user = user;
							res.json({
								user: user.get({plain:true})
							});
						});
					}else{
						models.User.findOrCreate({where:{username:email}}).spread(function (user, created) {
							if (created) {
								user.isActivated = true;
								user.password = security.encryptPassword(accessToken);
								user.preferredName = preferredName;
								user.token = crypto.createHash('sha256').update(email).digest('hex');
							};

							user.setUserIdAccessToken(network,userId,accessToken, function (user) {
								req.session.user = user;
								res.json({
									user: user.get({plain:true})
								});
							});
						});
					}
				})
			}
			
		}else{
			utils.apiDataError("SYS002",res);
		}
	}else if(type=="disconnect"){
		if (req.session.user) {
			var userId = req.session.user.id;
			models.User.findById(userId).then(function (user) {
				var clientId = null;
				switch(network){case "facebook": clientId = user.facebookId;break; case "google": clientId = user.googleplusId; break;}
				if (clientId) {
					user.setUserIdAccessToken(network,null,null,function (user) {
						req.session.user = user;
						res.json({
							user: user.get({plain:true})
						});
					})
				}else{
					utils.apiDataError("USR012",res);
				};
			});

		}else{
			utils.apiDataError("USR004",res);
		}
	}else {
		utils.apiDataError("SYS002",res);
	}

});

router.post('/password/change', security.isApiLoggedIn, function (req,res) {
	var oldPassword = req.body.oldPassword || null,
		newPassword = req.body.newPassword || null,
		newPasswordConfirm = req.body.newPasswordConfirm || null,
		current_user = req.session.user;

	if (oldPassword && newPassword && newPasswordConfirm) {
		models.User.findOne({where:{id:current_user.id,password:security.encryptPassword(oldPassword)}}).then(function (user) {
			if (user) {
				if (security.encryptPassword(newPassword)==security.encryptPassword(newPasswordConfirm)) {
					if (utils.validatePassword(newPassword)) {
						user.password = security.encryptPassword(newPassword);
						user.save().then(function (user) {
							req.session.user = user;
							res.json({
								user: user.get({plain:true})
							});
						});
					}else{
						utils.apiDataError("USR005",res);
					}
				}else{
					utils.apiDataError("USR002",res);
				}
			}else{
				utils.apiDataError("USR011",res);
			}
		});
	}else{
		utils.apiDataError("SYS002",res);
	}
	
});

router.post('/password/forget', function (req,res,next) {
	var username = req.body.username || "";

	async.parallel({
    	user: function (callback) {
    		models.User.findOne({where: {username:username}}).then(function (user) {
        		callback(null,user);
        	})
    	}
    }, function(err, results){
    	var user = results.user;

    	if (user) {
    		security.sendForgetPasswordEmail(user,req,function (err,info) {
    			if (err) {
					utils.apiDataError("USR008",res);
				}else{
					req.session.user = user;
					res.json({
						info: info.response
					})
				}
    		});
    	}else{
    		utils.apiDataError('USR009',res)
    	}
	});

});


module.exports = router;
