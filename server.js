/**
 * server.js
 * (c) Copyright 2017 FoilForest
 */
 
 //Include Classes
var router = require('./src/router');
var logger = require('./src/logger');

//Include Modules
var express = require('express');
var passport = require('passport');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
//var LocalStrategy = require('passport-local');
var favicon = require('serve-favicon');
var fs = require('fs');

// NEW
//var https = require('https');
//Read Key/Perm Files
//var pkey = fs.readFileSync('key.pem');
//var pcert = fs.readFileSync('cert.pem');
//var sslOptions = {
//	key: pkey,
//	cert: pcert
//};

//Login Strategies TODO
YahooStrategy = require('passport-yahoo-oauth').Strategy;


//App
var app = express();
//Set Jade view
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
//Set Directory Structure
app.use('/css', express.static(__dirname + '/css'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/lib', express.static(__dirname + '/lib'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use('/src', express.static(__dirname + '/src'));
app.use(favicon(__dirname + '/img/icon/popicon.ico', { mageAge: 1000*60*60*24*7}));
app.use(flash());

//Setup parsers
app.use(cookieParser('cookireParser-cookieSecret'));
app.use(session({ resave: true, saveUninitialized: true, secret: 'thisSecretIsNotUsed'}));
app.use(bodyParser.json({limit: '25mb', extended: true}));
app.use(bodyParser.urlencoded({extended: true}));

//Setup Passport authentication
app.use(passport.initialize());
app.use(passport.session());
//app.use(router.checkRememberMe);

logger.setup(app);
router.setup(app);
router.route(app, passport, logger);
	

/*
//Website
var YAHOO_CLIENT_ID = 'dj0yJmk9QURmTVVNOHplZXQ1JmQ9WVdrOWNUSktkVEZGTjJVbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1kMQ--';
var YAHOO_CLIENT_SECRET = 'a8a990ccf3908b56eb010ce909332bd90a1f37c5';

if (app.settings.env === "development") {
	var callbackUrl = "http://foilforest.com/auth/yahoo/callback";
} else {
	//Desktop
//	var YAHOO_CLIENT_ID ="dj0yJmk9amxJRUxkSmxXQ0tYJmQ9WVdrOVdrdFhObUZRTkdzbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD02MA--";
//	var YAHOO_CLIENT_SECRET = "654efc4f09e195e3d58033144f7fe048f0ab5dde";
	var callbackUrl = "https://fantasy-judges.herokuapp.com/auth/yahoo/callback"
//	var callbackUrl = "https://id.heroku.com/oauth/authorize?client_id=" + clientId + "&response_type=code&scope=" + scope + "&state=" + antiForgeToken;
}
passport.use(new YahooStrategy({
		consumerKey: YAHOO_CLIENT_ID,
		consumerSecret: YAHOO_CLIENT_SECRET,
		callbackURL: callbackUrl
	},
	function(token, tokenSecret, profile, done) {
//		db.findOrCreate(profile, function (err, user, info) {
//			console.log("Yahoo Login Err: " + err);
//			return done(err, user, info);
//		});
	}
));*/

app.set('port', (process.env.PORT || 80));
app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
//https.createServer(sslOptions, app).listen(app.get('port'), function() {
//	console.log('Express server listening on port ' + app.get('port'));
//});