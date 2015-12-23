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
var multer = require("multer");
var fs = require("fs");
router.get('/', security.isWebsiteLoggedIn, function(req, res, next) {
	models.Category.findAll({ raw: true }).then(function(cats){
		res.render('submit', { 
			cats: cats,
			startscript: 'controller/submit'
		});
	});
});

router.post('/', security.isWebsiteLoggedIn, multer({
  dest: './public/uploads/user/',
  limits: {
    fieldNameSize: 100,
    files: 2,
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
      var error = i18n.t("ns.server:error."+"FIL001");
		models.Category.findAll({ raw: true }).then(function(cats){
			res.render('submit', { 
			cats: cats,
			startscript: 'controller/submit',
			error: error
			});
		});
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
  }
}), function(req, res, next) {
	var categoryId = req.body.categoryId || null,
		title = req.body.title || null,
		hoko = req.body.hoko || "",
		tate = req.body.tate || "",
		tags = req.body.tags || null,
		days = req.body.days || null,
		answer = req.body.answer || "",

		files = req.files,
		hokoImgFile = files.hoko_img || null,
		tateImgFile = files.tate_img || null,
		hokoImg = null;
		tateImg = null;

		goError = function (code) {
			var error = i18n.t("ns.server:error."+code);
			models.Category.findAll({ raw: true }).then(function(cats){
				res.render('submit', { 
					cats: cats,
					startscript: 'controller/submit',
					error: error
				});
			});
		};

	if (hokoImgFile) {
		if (hokoImgFile.truncated) {
			goError("FIL002");
			return;
		}else{
			hokoImg = hokoImgFile.name;
		}
	};

	if (tateImgFile) {
		if (tateImgFile.truncated) {
			goError("FIL002");
			return;
		}else{
			tateImg = tateImgFile.name;
		}
	};

	if (categoryId && title && hoko && tate) {
		days = days || 30;
		if (parseInt(days)==days && days>0) {
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
									var postId = post.id;
									res.redirect('/details/'+postId);
								});
							});
						}else{
							goError("USR007");
						}
					});
				}else{
					goError("POS001");
				};
			});
		}else {
			goError("POS002");
			return;
		};
		
	}else{
		goError("SYS002");
	};


});

module.exports = router;
