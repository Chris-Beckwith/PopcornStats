/**
 * routerErrors.js
 * (c) Copyright 2017 Fantasy Judge.
 */

/*
 * 1xx Informational
 * 2xx Success
 * 3xx Redirection
 * 4xx Client Error
 * 5xx Server Error
 */

function handle(app, logger) {
	
	/*
	 * Test fuctions
	 */
	app.get('/403', function(req, res, next){
		//Not authorized to view this page
		var err = new Error('Not allowed!');
		err.status = 403;
		console.log("Error: 403");
		next(err);
	});
	
	app.get('/404', function(req, res, next){
		//Page not found
		console.log("Error: 404");
		var err = new Error('Page Not Found!');
		err.status = 404;
		next(err);
	});
	
	app.get('/452', function(req, res, next) {
		//Accounted Locked (deprecated)
		console.log("Error: 452");
		req.flash('err', 'Your account has been temporarily locked.');
		req.flash('err2', 'Please try again in approximately ' + 5 + ' seconds.');
		var err = new Error('High volume of invalid credentials!');
		err.status = 452;
		next(err);
	});

	app.get('/500', function(req, res, next){
		//Generic (500) error
		console.log("Error: 500");
		var err = new Error('Keyboard Cat!');
		err.status = 500;
		next(err);
	});
	
	app.get('/520', function(req, res, next){
		//Generic (500) error
		console.log("Error: 520");
		var err = new Error('Password Change Error Cat!');
		err.status = 520;
		next(err);
	});
	
	app.get('/521', function(req, res, next){
		//Generic (500) error
		console.log("Error: 521");
		var err = new Error('Display Name Change Error Cat!');
		err.status = 521;
		next(err);
	});
	
	// Error handlers

	// Since this is the last non-error-handling
	// middleware use()d, we assume 404, as nothing else
	// responded.
	app.use(function(req, res, next){
		console.log("All Errors - Error: 404");
		res.status(404);

		// respond with html page
		if (req.accepts('html')) {
			console.log("Error: HTML");
			var err = new Error('Page Not Found!');
			err.status = 404;
			res.render('errors/404', { url: req.url, errorCode: err.status, errorMsg: err.message, err: req.flash('err'), err2: req.flash('err2') });
			return;
		}

		// respond with json
		if (req.accepts('json')) {
			console.log("Error: JSON");
			res.send({ error: 'Not found' });
			return;
		}

		// default to plain-text. send()
		console.log("Error: PlainTXT");
		res.type('txt').send('Not found');
	});

	// error-handling middleware, take the same form
	// as regular middleware, however they require an
	// arity of 4, aka the signature (err, req, res, next).
	// when connect has an error, it will invoke ONLY error-handling
	// middleware.

	// If we were to next() here any remaining non-error-handling
	// middleware would then be executed, or if we next(err) to
	// continue passing the error, only error-handling middleware
	// would remain being executed, however here
	// we simply respond with an error page.

	app.use(function(err, req, res, next){
		// we may use properties of the error object
		// here and next(err) appropriately, or if
		// we possibly recovered from the error, simply next().
		res.status(err.status || 500);
		console.log("Error middleware Status " + err.status);

		//TODO change errors to something not helpful to hacking..
		//Account Locked (deprecated)
		if (err.status == 452 || err.status == 453)
			res.render('errors/452', { errorCode: err.status, errorMsg: err.message, err: req.flash('err'), err2: req.flash('err2') });
		//Page not found
		else if (err.status == 404)
			res.render('errors/404', { errorCode: err.status, errorMsg: err.message, err: req.flash('err'), err2: req.flash('err2') });
		//Password change error
		else if (err.status == 520)
			res.render('errors/520', { errorCode: err.status, errorMsg: err.message, err: req.flash('err'), err2: req.flash('err2') });
		//Display name change error
		else if (err.status == 521)
			res.render('errors/521', { errorCode: err.status, errorMsg: err.message, err: req.flash('err'), err2: req.flash('err2') });
		else
			res.render('errors/500', { errorCode: err.status, errorMsg: err.message, err: req.flash('err'), err2: req.flash('err2') });
	});
}

exports.handle = handle;