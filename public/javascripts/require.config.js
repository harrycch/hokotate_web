var require={
	waitSeconds: 0, 
	baseUrl: '/javascripts/',
	paths: {
		'jquery': 'vendor/jquery-2.1.4.min',
		'moment': 'vendor/moment-with-locales',
		'bootstrap': 'vendor/bootstrap.min',
		'textfill': 'vendor/jquery.textfill.min',
		'imagescale': 'vendor/image-scale.min',
		'gapi': 'https://apis.google.com/js/client:plusone',
		'sweet-alert': 'vendor/sweet-alert.min',
		'jscroll': 'vendor/jquery.jscroll.min',
		'controller.base': 'controller/base',
		'controller.index': 'controller/index',
		'controller.submit': 'controller/submit',
		'controller.login': 'controller/login',
		'controller.register': 'controller/register',
		'controller.reset_password': 'controller/reset_password'
	},
	shim: {
		'bootstrap': ['jquery'],
		'textfill': ['jquery'],
		'imagescale': ['jquery'],
		'jscroll': ['jquery']
	}
}