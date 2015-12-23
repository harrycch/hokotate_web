var async = require('async');
var S = require('string');
var moment = require('moment-timezone');
var config = require("./config");
var i18n = require("i18next");

module.exports.apiDataError = function(code, res) {
    return res.status(500).send({
		error: {
			code: code,
			message: i18n.t('ns.server:error.'+code)
		}
	});
}

module.exports.customLog = function () {
	for (var i = 0; i < arguments.length; i++) {
		console.log("\n\n\n",arguments[i],"\n\n\n");
	};
}

module.exports.getUploadPath = function(dest,req){
	return dest + (req.session.user && req.session.user.id || 'anonymous');
}

module.exports.validateImage = function(file){
	var availableTypes = config.imageTypes;

	return availableTypes.indexOf(file.mimetype)!=-1;
}

module.exports.validatePassword = function (value) {
	return /^[A-Za-z0-9\d=!\-@._*]*$/.test(value) // consists of only these
       // && /[a-z]/.test(value) // has a lowercase letter
       // && /\d/.test(value) // has a digit
       && value.length>=8
       && value.length<=20;
};

module.exports.validateEmail = function (email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}