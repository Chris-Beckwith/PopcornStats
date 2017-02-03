function showLeague(teamKey) {
	var league = document.getElementById(teamKey);
	toggle(league);
}

function showWeekly() {
	var weekly = document.getElementById('matchupSchedule');
	toggle(weekly);
}

function showCurrent() {
	var current = document.getElementById('matchupCurrentCompare');
	toggle(current);
}

function showPrevious() {
	var previous = document.getElementById('matchupPrevious');
	toggle(previous);
}

function showPreviousCompare(teamKey, week) {
	var dWeek = document.getElementById(week + "_" + teamKey);
	toggle(dWeek);
}

function toggle(elem) {
	if (elem.style.display === 'block')
		elem.style.display = 'none';
	else {
		elem.style.display = 'block';
		$('html, body').animate({
			scrollTop: $(elem).offset().top - $("#showLeague").height()*2 - 10
		}, 800);
	}
}

function hideMe(t) {
	var elem = document.getElementById("team" + t);
	elem.style.display = 'none';
}


$(function() {
//    console.log( "ready!" );
});

function onload(user) {
//	console.log(JSON.stringify(user));
//	console.log(user.displayName);
//	for(var i = 0; i< user.teams.size; i++) {
//		var team = user.teams[i];
//		console.log(team.name);
//	}
}