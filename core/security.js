var utils = require('./utils');
var config = require('./config');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var crypto = require("crypto");
var emailTemplates = require("email-templates");
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', 'views/mailer');
var i18n = require('i18next');

//is middleware
module.exports.isApiLoggedIn = function(req,res,next){
    if(req.session.user)
        next();
    else if(!res.headersSent)
    	utils.apiDataError("USR004",res);
}

// is middleware
module.exports.isWebsiteLoggedIn = function (req,res,next) {
	if (req.session.user) {
		next();
	}else{
		res.redirect('/login');
	}
}

module.exports.sendConfirmationEmail = function (user,req,callback) {
	var transporter = nodemailer.createTransport(smtpTransport(config.nodemailer));
	var url = (req.protocol + '://' + (req.headers['x-forwarded-host'] || req.get('host')) + '/email/confirm/' + user.token);

	emailTemplates(templatesDir, function (err, template) {
		if(err){
			callback(err, null);
			return;
		}
		template("account_confirmation",{url: url, t : i18n.t, req : req} , function (err, html, text) {
			if(err){
				callback(err, null);
				return;
			}
			transporter.sendMail({
			    from: config.mailOptions.from,
			    to: user.username,
			    subject: i18n.t("ns.mailer:account_confirmation.title"),
			    html: html
			}, function (err, info) {
				console.error("Email Callback:",err,info);
				callback(err,info);
			});
		})
	})	
}

module.exports.sendForgetPasswordEmail = function (user,req,callback) {
	var transporter = nodemailer.createTransport(smtpTransport(config.nodemailer));
	var url = (req.protocol + '://' + (req.headers['x-forwarded-host'] || req.get('host')) + '/password/reset/' + user.token);
	
	emailTemplates(templatesDir, function (err, template) {
		if(err){
			callback(err, null);
			return;
		}
		template("reset_password",{url: url, t : i18n.t, req : req} , function (err, html, text) {
			if(err){
				callback(err, null);
				return;
			}
			transporter.sendMail({
			    from: config.mailOptions.from,
			    to: user.username,
			    subject: i18n.t("ns.mailer:reset_password.title"),
			    html: html
			}, function (err, info) {
				console.error("Email Callback:",err,info);
				callback(err,info);
			});
		})
	})	
}

module.exports.encryptPassword = function (plainPassword) {
	return crypto.createHash('sha256').update(plainPassword).digest('hex');
}
