/**
  * util.js
  * (c) Copyright 2017 Fantasy Judge
  */
var fs = require('fs');

var prefix = 'json/';
var suffix = '.json';

var request = require('request');

var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';

function getTeams(user, res, callback) {
	var teamApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nba/teams?format=json'

	var options = {
		url: teamApiUrl,
		headers: { Authorization: 'Bearer ' + user.yahooAccessToken },
		rejectUnauthorized: false,
		json: true
	}
	
	request.get(options, function(err, response, body) {
		console.log(JSON.stringify(body, null, 2));
		var teams = [];
		try {
			var tms = body.fantasy_content.users[0].user[1].games[0].game[1].teams;
			var count = body.fantasy_content.users[0].user[1].games[0].game[1].teams.count;
			
			for (var i = 0; i < count; i++) {
				var team = {};
				team.key = tms[i].team[0][0].team_key;
				team.id = tms[i].team[0][1].team_id;
				team.name = tms[i].team[0][2].name;
				team.roster = tms[i].team[0][4].url;
				team.logo = tms[i].team[0][5].team_logos[0].team_logo.url;
				team.isReady = true;
				
				teams.push(team);
			}
		} catch (e){
			console.log("error::::t " + e);
		}
		user.teams = teams;
		callback(user);
	});
}

function getLeagues(user, res, callback) {
	console.log(" ** GET LEAGUES ** ");
	if (user.teams.length == 0)
		return callback(user);
	
	var leagueApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nba/leagues?format=json'

	var options = {
		url: leagueApiUrl,
		headers: { Authorization: 'Bearer ' + user.yahooAccessToken },
		rejectUnauthorized: false,
		json: true
	}

	request.get(options, function(err, response, body) {
		console.log("REQUEST RETURN");
		var leagues = [];
		try {
			var lgs = body.fantasy_content.users[0].user[1].games[0].game[1].leagues;
			var count = body.fantasy_content.users[0].user[1].games[0].game[1].leagues.count;
			
			for (var i = 0; i < count; i++) {
				console.log("League Key: " + lgs[i].league[0].league_key);
				console.log("Num Teams: " + lgs[i].league[0].num_teams);
//				console.log(lgs[i].league[0].draft_status.equals("postdraft") && lgs[i].league[0].num_teams > 1);
				var league = {};
				league.key = lgs[i].league[0].league_key;
				league.id = lgs[i].league[0].league_id;
				league.name = lgs[i].league[0].name;
				league.url = lgs[i].league[0].url;
				league.season = lgs[i].league[0].season;
				
				if (lgs[i].league[0].draft_status.equals("postdraft") && lgs[i].league[0].num_teams > 1) {
					league.numTeams = lgs[i].league[0].num_teams;
					league.startWeek = lgs[i].league[0].start_week;
					league.endWeek = lgs[i].league[0].end_week;
					league.currentWeek = lgs[i].league[0].current_week;
					console.log("League Name: " + league.name);
				} else {
					for (n = 0; n < user.teams.length; n++) {
						if (user.teams[n].key.includes(lgs[i].league[0].league_key))
							user.teams[n].isReady = false;
					}
					 
				}
				leagues.push(league);
			}
		} catch (e){
			console.log("error::::l " + e);
		}
		user.leagues = leagues;
		callback(user);
	});
}

function getSchedule(user, res, callback) {
	console.log(" ** GET SCHEDULE ** ");
	if (user.teams.length == 0)
		return callback(user);
	
	var teams = user.teams;
	var count = 0;
	for(var i = 0; i < teams.length; i++) {
		var team = teams[i];
		console.log("TEAM: " + team.name + " " + team.isReady);
		
		if (team.isReady) {
			var scheduleApiUrl = "https://fantasysports.yahooapis.com/fantasy/v2/team/" + team.key + "/matchups?format=json"

			var options = {
				url: scheduleApiUrl,
				headers: { Authorization: 'Bearer ' + user.yahooAccessToken },
				rejectUnauthorized: false,
				json: true
			}
			request.get(options, function(err, response, body) {
				try {
					var teamKey = body.fantasy_content.team[0][0].team_key;
					var leagueIndex;
					var matchups = [];
					var results = [];
					var mtchps = body.fantasy_content.team[1].matchups;
					var mtchCount = body.fantasy_content.team[1].matchups.count;

					for (var n = 0; n < user.leagues.length; n++)
						if (teamKey.includes(user.leagues[n].key))
							leagueIndex = n;

					user.leagues[leagueIndex].teamNames = [];
					
					for (var i = 0; i < mtchCount; i++) {
						var teamId = mtchps[i].matchup[0].teams[1].team[0][1].team_id;
						matchups[i] = {};
						matchups[i].teamId = mtchps[i].matchup[0].teams[1].team[0][1].team_id;
						matchups[i].teamName = mtchps[i].matchup[0].teams[1].team[0][2].name;
						user.leagues[leagueIndex].teamNames[teamId] = mtchps[i].matchup[0].teams[1].team[0][2].name;
						if (mtchps[i].matchup.winner_team_key) {
//							console.log("**** " + mtchps[i].matchup.winner_team_key);
//							console.log("**** " + teamKey);
//							console.log("**** " + mtchps[i].matchup.winner_team_key.equals(teamKey));
							results[i] = mtchps[i].matchup.winner_team_key.equals(teamKey);
							matchups[i].result = mtchps[i].matchup.winner_team_key.equals(teamKey);
						}
					}

					user.leagues[leagueIndex].matchups = matchups;
					user.leagues[leagueIndex].results = results;
				} catch (e){
					console.log("error::::s " + e);
				}
				count++;
				if (count == teams.length) {
					callback(user);
				}
			});
		} else {
			count++;
		}
	}
}


/**
 * TODO
 */
function getPlayers(user, res, callback) {
	
	var count = 0;
	for(var i = 0; i < user.leagues.length; i++) {
		var leagueKey = user.leagues[i].key;
//		var playersApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/' + leagueKey + '/players?format=json';
		var playersApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/player/' + "364.p.3643" + '/stats?format=json';
	//	var teamApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nba/teams?format=json'
	//
		var options = {
			url: playersApiUrl,
			headers: { Authorization: 'Bearer ' + user.yahooAccessToken },
			rejectUnauthorized: false,
			json: true
		}

		request.get(options, function(err, response, body) {
			writeJSON(body, "player", function() {
				console.log("DONE");
			});
			var players = [];
	//		try {
	//			var tms = body.fantasy_content.users[0].user[1].games[0].game[1].teams;
	//			var count = body.fantasy_content.users[0].user[1].games[0].game[1].teams.count;
	//			
	//			for (var i = 0; i < count; i++) {
	//				var team = {};
	//				team.key = tms[i].team[0][0].team_key;
	//				team.id = tms[i].team[0][1].team_id;
	//				team.name = tms[i].team[0][2].name;
	//				team.roster = tms[i].team[0][4].url;
	//				team.logo = tms[i].team[0][5].team_logos[0].team_logo.url;
	//				team.isReady = true;
	//				
	//				teams.push(team);
	//			}
	//		} catch (e){
	//			console.log("error:::: " + e);
	//		}
	//		user.teams = teams;
			count++;
			if (count == user.leagues.length) {
				callback(players);
			}
		});
	}
}
/**
 * TODO
 */

function updateTeams(accessToken, response, callback) {
	console.log("TEST");
	//var teamApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games/teams?format=json'
	//var UserGuidUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1?format=json'
	//var leagueUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json'
	//var settingsUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/settings?format=json'
	//var scoreboardUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/scoreboard?format=json'
	//var draftresultsUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/draftresults?format=json'
	//var transactionsUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/transactions?format=json'
	//var leagueTeamsUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/teams?format=json'
	//var playersUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/players?format=json'  //TODO WHAT???? Short list
	//var teamApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/359.l.83074/players?format=json'
	//var teamNFLApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams?format=json'
	try {
		var teamNFLApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams?format=json';
		var leagueNames = [];
		var teamNames = [];
		
		var options = {
			url: teamNFLApiUrl,
			headers: { Authorization: 'Bearer ' + accessToken },
			rejectUnauthorized: false,
			json: true
		}
		
		request.get(options, function(err, response, body) {
			var tms = body.fantasy_content.users[0].user[1].games[0].game[1].teams;
			var count = body.fantasy_content.users[0].user[1].games[0].game[1].teams.count;
			for (var i = 0; i < count; i++) {
				//console.log("Team name: " + tms[i].team[0][2].name);
				//console.log("Team name: " + tms[i].team[0][0].team_key);
				teamNames.push(tms[i].team[0][2].name);
			}
			/*writeJSON(body, 'userData2', function() {TODO TeamNames  Save this to database/cookie..  Need TeamName(id) - LeagueName(id) relationship.
				if (err) console.log("*** err: " + err);
			});*/
		
			var leagueNFLApiUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json';
			options.url = leagueNFLApiUrl;
			
			request.get(options, function(err, response, body) {
				var lgs = body.fantasy_content.users[0].user[1].games[0].game[1].leagues;
				var count = body.fantasy_content.users[0].user[1].games[0].game[1].leagues.count;
				for (var i = 0; i < count;) {
					leagueNames.push(lgs[i].league[0].name);
					
					var settingsUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/league/' + lgs[i].league[0].league_key + '/settings?format=json';
					options.url = settingsUrl;
					request.get(options, function(err, response, body) {
						//console.log(body.fantasy_content.league[0].league_key);
						writeJSON(body, body.fantasy_content.league[0].league_key, function() {
							if (err) console.log("*** err: " + err);
						});
					});
					
					i++;
					
					if ( i == count) {
						leagueNames.forEach(function(value, index, array) {
							console.log("leagueName: " + value)
						});
						teamNames.forEach(function(value, index, array) {
							console.log("teamName: " + value)
						});
						
						callback(leagueNames, teamNames);
					}
				}
				/*writeJSON(body, 'userData', function() {TODO CHANGE FILE NAME  LeagueNames.. Save this to database/cookie.  actually this is saved in the settings file.
					if (err) console.log("*** err: " + err);
					
				});*/
			});
		});
	} catch (e) {
		console.log("WUT: " + e);
		callback();
	}
}

function getNewAccessToken(user, res, redirectUri, clientId, clientSecret, callback) {
	console.log("refresh_token: " + user.yahooRefreshToken);
	var accessTokenOptions = {
		url: accessTokenUrl,
		headers: { Authorization: 'Basic ' + new Buffer(clientId + ':' + clientSecret).toString('base64') },
		rejectUnauthorized: false,
		json: true,
		form: {
			refresh_token: user.yahooRefreshToken,
			redirect_uri: redirectUri,
			grant_type: 'refresh_token'
		}
	};
	// 1. Exchange authorization code for access token.
	request.post(accessTokenOptions, function(err, response, body) {
		if (err) { console.log("Error getting refresh token: " + err); }
//		console.log(JSON.stringify(body, null, 2));
		user.yahooAccessToken = body.access_token;
		callback(user);
	});
}

function writeJSON(json, fileName, callback) {
	console.log("writeJSON");
	//console.log(json[0]);
	var dir = prefix + fileName.substring(0, fileName.lastIndexOf('/'));
	var myJSONString = JSON.stringify(json, null, '\t');
//	var myJSONString = json;
	var myEscapedJSONString = myJSONString.replace(/\\n/g, "\\n")
                                      .replace(/\\'/g, "\\'")
                                      .replace(/\\"/g, '\\"')
                                      .replace(/\\&/g, "\\&")
                                      .replace(/\\r/g, "\\r")
                                      .replace(/\\t/g, "\\t")
                                      .replace(/\\b/g, "\\b")
                                      .replace(/\\f/g, "\\f");
	fs.mkdir(dir, function(err) {
		if (err && err.code != 'EEXIST')
			return console.log("mkdir error: " + err);
		fs.writeFile(prefix + fileName + suffix, myEscapedJSONString, function(err) {
			if (err) {return console.log("writeFile err: " + err);}
			console.log("written");
			callback();
			//test return... TODO
		})
	});
}

function readJSON(fileName, callback) {
	console.log("readJSON");
	fs.readFile(prefix + fileName + suffix, function(err, data) {
		if (err) {return console.log("readJSON err: " + err); }
		callback(data);
	});
}

//Extracts parameters passed via the URL.
function getQueryStrings(req) {
	var assoc = {};
	var decode = function(s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
	console.log(req.url + " split: " + req.url.split('?'));
	var queryString = req.url.split('?')[1];
	
	if (queryString)
		var keyValues = queryString.split('&');
	
	for (var i in keyValues) {
		var key = keyValues[i].split('=');
		if (key.length > 1) {
			assoc[decode(key[0])] = decode(key[1]);
		} else {
			assoc[decode(key[0])] = true;
		}
	}
	
	return assoc;
}

String.prototype.equals = function(String) {
	return this.localeCompare(String) == 0;
}

exports.updateTeams = updateTeams;
exports.getNewAccessToken = getNewAccessToken;
exports.getQueryStrings = getQueryStrings;
exports.writeJSON = writeJSON;
exports.readJSON = readJSON;
exports.getTeams = getTeams;
exports.getLeagues = getLeagues;
exports.getSchedule = getSchedule;
exports.getPlayers = getPlayers;