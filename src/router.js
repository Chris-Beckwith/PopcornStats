/* 
 * router.js
 * (c) Copyright 2017 Fantasy Judge.
 */

 //Include Classes
var utils = require('./utils');
//var mailer = require('./mailer');
var errorHandler = require('./routerErrors');
//Include Modules
var fs = require('fs');
//var url = require('url');
var qs = require('querystring');
var request = require('request');

//Recaptcha
//var PUBLIC_KEY = '6LeBHfgSAAAAAGCgw04vvvbEvZpZg-f_XdTqGK5i';
//var PRIVATE_KEY = '6LeBHfgSAAAAAHSFPnfS6TWhrfoliZUCGvdqjfZt';
//var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY);

/* * TODO Make work with passport (server.js) * */
var clientId;
var clientSecret;

var redirectUri;
var antiForgeToken = 'antiForgeToken';
var scope = 'global';

var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';

//var maxAgeRememberMe = 7 * 24 * 60 * 60 * 1000;  //7 days
var maxAgeRememberMe = 2 * 60 * 1000;  //2 mins

function route(app, passport, logger) {
	//Start of routes
	app.route('/login')
		.get(ensureNotAuthenticated, function(req, res) {
			renderPage('login', req, res);
		})
		
		.post(function(req, res, next) { passport.authenticate('local-login', 
			function(err, user, info) {
				processLogin(req, res, next, err, user, info);
			})(req, res, next);
		});
	
	app.get('/logout', function(req, res) {
//		if (req.signedCookies._vid)
//			db.removeRememberMe(req.signedCookies._vid);
		res.clearCookie('_vid');
		req.flash('lastPage');
//		req.logout();
		delete req.session.user;
		res.redirect('/');
	});
    
	//Yahoo! Login Start
	app.get('/auth/yahoo', function(req, res) {
		/****
		passport.authenticate('yahoo'),
			function(req, res){
				// The request will be redirected to Yahoo for authentication, so this
			 	// function will not be called.
			};
		/****/
		console.log("AUTH/YAHOO");
		var authorizationUrl = 'https://api.login.yahoo.com/oauth2/request_auth';
		var queryParams = qs.stringify({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code'
		});
		
		console.log("redirectURI " + redirectUri);
		console.log("clientID " + clientId);
		res.redirect(authorizationUrl + '?' + queryParams);
	});

	// Yahoo! Login Callback
	app.get('/auth/yahoo/callback', function(req, res) {
		console.log("Yahoo Callback Start");
		
		var accessTokenOptions = {
			url: accessTokenUrl,
			headers: { Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64') },
			rejectUnauthorized: false,
			json: true,
			form: {
				code: req.query.code,
				redirect_uri: redirectUri,
				grant_type: 'authorization_code'
			}
		};
		
		// 1. Exchange authorization code for access token.
		request.post(accessTokenOptions, function(err, response, body) {
			console.log("request.post");
			var guid = body.xoauth_yahoo_guid;
			var accessToken = body.access_token;
			var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + guid + '/profile?format=json';
			var refresh_token = body.refresh_token;
			
			console.log("Login refresh_token: " + body.refresh_token);
			var options = {
				url: socialApiUrl,
				headers: { Authorization: 'Bearer ' + accessToken },
				rejectUnauthorized: false,
				json: true
			};

			// 2. Retrieve profile information about the current user.
			request.get(options, function(err, response, body) {
				console.log("* * YahooUser * *" + JSON.stringify(body, null, 2));
				// 3. Create a new user account or return an existing one.
				var yahooUser = {
					email: 'null8@nullmail.com',
					displayName: body.profile.givenName,
					firstName: body.profile.givenName,
					lastName: body.profile.familyName,
					yahooGuid: guid,
					yahooProfileImage: body.profile.image.imageUrl,
					yahooAccessToken: accessToken,
					yahooRefreshToken: refresh_token,
					yahooProfileUrl: body.profile.profileUrl
				};
				req.session.user = yahooUser;
//				console.log("User: " + req.session.user);
				res.redirect('/yahooTeamCompare');
			});
		});
	});
	
	app.get('/yahooTeamCompare', function(req,res) {
		if (!req.session.user) {
			return res.redirect('/');
		}
//		console.log("USER: " + req.session.user.teams);
//		if (typeof req.session.user.teams == "undefined") {
		utils.getNewAccessToken(req.session.user, res, redirectUri, clientId, clientSecret, function(user) {
			utils.getTeams(req.session.user, res, function(user) {
				utils.getLeagues(user, res, function(user) {
					utils.getSchedule(user, res, function(user) {
						res.render('yahooFBasketB', {
							title: 'Yahoo Team Compare',
							user: user
						});
					});
				});
			});
		});
//		} else {
//			res.render('yahooFBasketB', {
//				title: 'Yahoo Team Compare',
//				user: req.session.user
//			});
//		}
	});
    
	
	app.get('/players', function(req, res) {
		if (!req.session.user) {
			return res.redirect('/');
		}
		
		console.log("PLAYERS");
		
		utils.getPlayers(req.session.user, res, function(user) {
			console.log("Received");
			res.render('yahooFBasketB', {
				title: 'Yahoo Team Compare',
				user: req.session.user
			});
		});
		
	});
	
	
	app.route('/contact')
		.get(function(req, res) {
			renderPage('contact', req, res);
		})
		
		.post(function(req, res) {
			if (req.body.agreeToTerms) {
				console.log("Sure, I'll take that request");
				req.flash('suc', 'Your message has been received.');
				res.redirect('contact');
			} else {
				console.log("Yes, I have received your request");
				mailer.sendContact(req, res);
			}
		});
	/****/
	
	
	app.get('/', function(req, res) {
		req.flash('lastPage');
		req.flash('lastPage', req.url);
//		if (req.user) {
//			//TODO userName for third party accounts (eg, Yahoo, Google, etc)
//			var userName = req.user.displayName ? req.user.displayName : req.user.email;
//			console.log("RenderIndex, userName: " + userName);
//			res.render('index', { title: 'PopCornStats Home', activePage: 'index', userName: userName, email: req.user.email, dName: req.user.displayName, err: req.flash('err'), suc: req.flash('suc') });
		if (req.session.user) {
			res.render('index', { title: 'PopCornStats Home', activePage: 'index', err: req.flash('err'), suc: req.flash('suc'), user: req.session.user});
		} else
			res.render('index', { title: 'PopCornStats Home', activePage: 'index', err: req.flash('err'), suc: req.flash('suc') });
    });
	
	/* Error Handlers */
	errorHandler.handle(app, logger);
}

function renderPage(page, req, res, data) {
	if (typeof data === 'undefined')
		data = '';
	req.flash('lastPage');
	req.flash('lastPage', req.url);
	if (req.user) {
		var userName = req.user.displayName ? req.user.displayName : req.user.email;
		console.log("RenderPage: " + page + " userName: " + userName);
		res.render(page, { activePage: page, userName: userName, email: req.user.email, dName: req.user.displayName, err: req.flash('err'), suc: req.flash('suc'), data: data });
	} else
		res.render(page, { activePage: page, err: req.flash('err'), suc: req.flash('suc'), data: data });
}

function setRememberMeCookie(res, uID, token, redirectURL) {
	res.cookie('_vid', {uID: uID, token: token}, { signed: true, maxAge: maxAgeRememberMe });
	res.redirect(redirectURL);
}

function ensureNotAuthenticated(req, res, next) {
	if (req.isAuthenticated())
		res.redirect(req.flash('lastPage'));
	else
		next();
}

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated())
		return next();
	
	req.flash('err');
	req.flash('err', 'You must be logged in to view that page.');  //Make this RoyalCat Error page.  TODO
	res.redirect('/');
}

function processLogin(req, res, next, err, user, info) {
	var redirectUrl = req.flash('lastPage');
	var id = req.flash('id');
	if (redirectUrl == '')
		redirectUrl = '/';
	
	if (err && (err.status == 452 || err.status == 453)) {
		req.flash('err');
		req.flash('err', 'The user credentials you entered were invalid');
		res.redirect('loginReCaptcha');
		return;
	} else if (err) { return next(err); }
	
	if (!info || (info && info.message == 'Invalid')) {
		req.flash('err', 'The user credentials you entered were invalid');
		if (redirectUrl == '/loginReCaptcha')
			res.redirect('loginReCaptcha');
		else
			res.redirect('login');
	} else if (info.message == 'Deleted') {
		req.flash('err', 'Your account was not validated and has been deleted.');
		res.redirect('/');
	} else if (info.message == 'TempCode') {
		req.flash('err', 'Please enter your temporary code to reset your password');
		res.redirect('resetPassword');
	} else if (info.message == 'Success' && user){
		if (redirectUrl == '/login' || redirectUrl == '/forgotPassword' || redirectUrl == '/register' || !info.isValidated)
			redirectUrl = '/profile';
		if (info.failCount > 3) {
			redirectUrl = '/profile';
			req.flash('err', 'Your account had ' + info.failCount + ' failed logins since your last login.');
		}
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			console.log('id: ' + id.length);
			if (id.length > 0)
				redirectUrl = 'completeRegistration?id=' + id;
			
			console.log('redirectUrl: ' + redirectUrl);
//			db.addRememberMe(res, user, redirectUrl, setRememberMeCookie); //Set Cookie Here
		});
	} else {
		if (redirectUrl == '/loginReCaptcha')
			res.redirect('loginReCaptcha');
		else
			res.redirect('login');
	}
}

function makeAPICall() {

}

function setup(app) {
	console.log("Router SETUP: " + app.settings.env);
	if (app.settings.env === "development") {
		clientId = process.env.CLIENT_ID_DEV;
		clientSecret = process.env.CLIENT_SECRET_DEV;
		redirectUri = 'http://foilforest.com/auth/yahoo/callback';
	} else if (app.settings.env === "staging") {
		clientId = process.env.CLIENT_ID_STAGING;
		clientSecret = process.env.CLIENT_SECRET_STAGING;
		redirectUri = 'http://dev.popcornstats.com/auth/yahoo/callback';
	} else if (app.settings.env === "production") {
		clientId = process.env.CLIENT_ID_PROD;
		clientSecret = process.env.CLIENT_SECRET_PROD;
		redirectUri = 'http://www.popcornstats.com/auth/yahoo/callback';
	}
}

//Called before every request.
//function checkRememberMe(req, res, next) {
//	if (!req.isAuthenticated() && req.signedCookies._vid)
//		db.checkRememberMe(req, res, next, setRememberMeCookie);
//	else
//		next();
//}

exports.route = route;
exports.setup = setup;
//exports.checkRememberMe = checkRememberMe;