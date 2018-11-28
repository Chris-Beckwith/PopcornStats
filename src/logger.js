var fs = require('fs');
var systemLogger = require('morgan');
var logger = require('winston');

var today = new Date();
var month = today.getMonth()+1;
var day = today.getDate();
var year = today.getFullYear();

function setup(app) {

	if (month < 10)
		month = 0 + '' + month;
	if (day < 10)
		day = 0 + '' + day;

	var dateString = '' + day + month + year;

	// create a write stream (in append mode)
	var accessLogStream = fs.createWriteStream(__dirname + '/logs/system_' + dateString + '.log', {flags: 'a'})
	// setup the systemLogger
	app.use(systemLogger('combined', {stream: accessLogStream}))

	app.use(function(req, res, next) {
		//Check Logger
		var currentMonth = today.getMonth() + 1;
		var currentDay = today.getDate();
		var currentYear = today.getFullYear();
		
		if (currentMonth < 10)
			currentMonth = 0 + '' + currentMonth;
		if (currentDay < 10)
			currentDay = 0 + '' + currentDay;
		
		var currentDateString = '' + currentDay + currentMonth + currentYear;
		
		if (currentDateString !== dateString) {
			dateString = currentDateString;
			day = currentDay;
			month = currentMonth;
			year = currentYear;
			
			logger.remove(logger.transports.File);
			logger.add(logger.transports.File, { filename: __dirname + '/logs/logger_' + dateString + '.log' });
		}
		next();
	});

	// setup logger
	logger.handleExceptions(new logger.transports.File({ filename: __dirname + '/logs/exceptions.log' }))
	logger.add(logger.transports.File, { filename: __dirname + '/logs/logger_' + dateString + '.log' });
	logger.exitOnError = false;
}

exports.setup = setup;