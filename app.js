var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var i18n = require('i18next');
var moment = require('moment-timezone');
var numeral = require('numeral');
var multer = require('multer');
var fs = require('fs');
var utils = require('./core/utils');
//import app module
var config = require("./core/config");

var apiUsers = require('./routes/api/users');
var apiPosts = require('./routes/api/posts');
var apiCategories = require('./routes/api/categories');
var profile = require('./routes/profile');
var submit = require('./routes/submit');
var security = require('./routes/security');
var index = require('./routes/index');
var more = require('./routes/more');

//init
var app = express();
i18n.init(config.i18next);

//template helper
i18n.registerAppHelper(app);
//inject function to template area
app.locals.moment = moment;
app.locals.numeral = numeral;
app.locals.config = {
    moment: config.moment
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(i18n.handle);
app.use(session(config.session));
app.use(function(req,res,next){
    res.locals.current_user = req.session.user;
    next();
});
app.use(function (req,res,next) {
    if (req.session.alert_message) {
      res.locals.alert_message = req.session.alert_message;
      req.session.alert_message = null;
    };
    next();
})
app.use(function(req,res,next){
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    next();
});

app.use('/api/users', apiUsers);
app.use('/api/posts', apiPosts);
app.use('/api/categories',apiCategories);
app.use('/submit', submit);
app.use('/profile', profile);
app.use('/more',more);
app.use('/',security);
app.use('/',index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
