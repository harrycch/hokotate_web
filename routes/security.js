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
var md5 = require("MD5");
var crypto = require('crypto');

router.get('/login', function(req, res, next) {
	if (req.session.user) {
		res.redirect('/');
		return;
	};

	models.Category.findAll({ raw: true }).then(function(cats){
		res.render('login', { 
			cats: cats,
			startscript: 'controller/login'
		});
	});
});

router.post('/login', function(req, res, next) {
	if (req.session.user) {
		res.redirect('/');
		return;
	};

	var username = req.body.username || null,
		password = req.body.password || "",
		error = null,
		goError = function (code) {
			var error = i18n.t('ns.server:error.'+code);
			models.Category.findAll({ raw: true }).then(function(cats){
				res.render('login', { 
					cats: cats,
					startscript: 'controller/login',
					error: error
				});
			});
		};

	if (username!=null) {
		models.User.findOne({where: {username:username, password:crypto.createHash('sha256').update(password).digest('hex')}}).then(function (user) {
			if (user==null) {
				goError("USR001");
			}else{
				req.session.user = user;
				res.redirect('/');
			};
		});
	}else{
		goError("SYS002");
	};

});

router.get('/register', function(req, res, next) {
	if (req.session.user) {
		res.redirect('/');
		return;
	};

	models.Category.findAll({ raw: true }).then(function(cats){
		res.render('register', { 
			cats: cats,
			startscript: 'controller/register'
		});
	});
});

router.post('/register', function(req, res, next) {
	if (req.session.user) {
		res.redirect('/');
		return;
	};
	
	var username = req.body.username || null,
		password = req.body.password || null,
		passwordConfirm = req.body.passwordConfirm || null,
		preferredName = req.body.preferredName || null,
		error = null,
		goError = function (code) {
			var error = i18n.t('ns.server:error.'+code);
			models.Category.findAll({ raw: true }).then(function(cats){
				res.render('register', { 
					cats: cats,
					startscript: 'controller/register',
					error: error
				});
			});
		};

	if (username!=null && passwordConfirm!=null && password!=null) {
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
								security.sendConfirmationEmail(user,req,function (err,info) {
								});
								req.session.user = user;
								res.redirect('/');		
							});
						}else{
							goError("USR003");
						}
					});
				}else{
					goError("USR005");
				}
			}else{
				goError("USR002");
			};
		}else{
			goError("USR006");
		}
		
	}else{
		goError("SYS002");
	};

});

router.get('/email/confirm/:token', function (req,res,next) {
	var token = req.params.token;

	async.parallel({
    	cats: function(callback){
		    models.Category.findAll({ raw: true }).then(function(cats){
		    	callback(null,cats);
		    });
    	},
    	user: function (callback) {
    		models.User.findOne({where: {token:token}}).then(function (user) {
        		callback(null,user);
        	})
    	}
    }, function(err, results){
    	var cats = results.cats,
    		user = results.user;

    	if (user) {
    		user.isActivated = true;
	    	user.save().then(function (user) {
	    		if (req.session.user) {
	    			req.session.user = user;	// Update the current user only if logged in
	    		};
	    		res.render('email_confirmation', { 
					cats: cats,
					startscript: 'controller/login',
					error: false
				});
	    	})
		}else{
			res.render('email_confirmation', { 
				cats: cats,
				startscript: 'controller/login',
				error: "USR009"
			});
		}
	});
} );


router.post('/password/reset/:token', function (req,res,next) {
	var token = req.params.token,
		newPassword = req.body.newPassword || "",
		newPasswordConfirm = req.body.newPasswordConfirm || "";

	async.parallel({
    	cats: function(callback){
		    models.Category.findAll({ raw: true }).then(function(cats){
		    	callback(null,cats);
		    });
    	},
    	user: function (callback) {
    		models.User.findOne({where: {token:token}}).then(function (user) {
        		callback(null,user);
        	})
    	}
    }, function(err, results){
    	var cats = results.cats,
    		user = results.user,
    		error = null;

    	if (user) {
    		if (security.encryptPassword(newPassword)==security.encryptPassword(newPasswordConfirm)) {
    			if (utils.validatePassword(newPassword)) {
    				user.password = security.encryptPassword(newPassword);
    				user.save().then(function (user) {
			    		if (req.session.user) {
			    			req.session.user = user;	// Update the current user only if logged in
			    		};
			    		req.session.alert_message = i18n.t('ns.general:reset_password.success');
			    		res.redirect('/login');
			    		return;
			    	})
    			}else{
    				error = "USR005";
    			}
    		}else{
    			error = "USR002";
    		}
		}else{
			error = "USR009";
		}

		if (error) {
			res.redirect('/password/reset/'+token+"?error="+error);
		};
	});
});

router.get('/password/reset/:token', function (req,res,next) {
	var error = req.query.error || null;

	models.Category.findAll({ raw: true }).then(function(cats){
    	res.render('reset_password', {
    		cats: cats,
    		startscript: 'controller/reset_password',
    		error: error && i18n.t('ns.server:error.'+error)
    	});
    });
});

router.post('/password/forget', function (req,res,next) {
	var username = req.body.username || "";

	async.parallel({
    	cats: function(callback){
		    models.Category.findAll({ raw: true }).then(function(cats){
		    	callback(null,cats);
		    });
    	},
    	user: function (callback) {
    		models.User.findOne({where: {username:username}}).then(function (user) {
        		callback(null,user);
        	})
    	}
    }, function(err, results){
    	var cats = results.cats,
    		user = results.user;

    	if (user) {
    		security.sendForgetPasswordEmail(user,req,function (err,info) {});
    		req.session.alert_message = i18n.t('ns.general:forget_password.success');
			req.session.user = user;
			res.redirect('/');
    	}else{
    		res.redirect('/password/forget?error=USR009');
    	}
	});

});

router.get('/password/forget', function (req,res,next) {
	var error = req.query.error || null;

	models.Category.findAll({ raw: true }).then(function(cats){
    	res.render('forget_password', {
    		cats: cats,
    		startscript: 'controller/forget_password',
    		error: error && i18n.t('ns.server:error.'+error)
    	});
    });
});



module.exports = router;