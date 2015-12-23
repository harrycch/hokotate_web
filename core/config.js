var config = {
	itemPerPage: 10,
	commentPerPage: 5,
	i18next: { 
	    lng: "en-US",
	    ignoreRoutes: ['public/'],
	    fallbackLng: "en-US",
	    supportedLngs: ['en-US'],
	    ns: {
	    	namespaces: ['ns.general','ns.server','ns.post','ns.profile','ns.mailer'], 
    		defaultNs: 'ns.general'
	    }
	},
    session: {				//carefull dont out put in jade
		secret: 'uthink_hokotate',
		resave: false,
		saveUninitialized: true
	},
	moment:{
		zeroTimeZone: 'Africa/Abidjan',
		timeZone: 'Asia/Hong_Kong',
		dateFormat: 'YYYY-MM-DD',
		dateTimeFormat: 'YYYY-MM-DD HH:mm:ss'
	},
	imageTypes: [
		"image/jpeg",
		"image/jpg",
		"image/gif",
		"image/png",
		"image/bmp"
	],
	nodemailer: {
		port: 587,
		host: "mail.uthink-tech.com",
	    auth: {
	        user: 'hokotate@uthink-tech.com',
	        pass: 'Mie2014'
	    },
	    tls: {
	    	rejectUnauthorized: false
	    }
	},
	mailOptions: {
		from: 'HokoTate <hokotate@uthink-tech.com>'
	}
};

module.exports = config;