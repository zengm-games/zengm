/**
 * @author SV
 * @name views.newTeam
 * @namespace New Team.
 */
define(["db", "globals", "ui", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, bbgmView, helpers, viewHelpers) {
    "use strict";


	function post(req) {
		var tid;
		$("#new-team").attr("disabled", "disabled");
		tid=Math.floor(req.params.tid);
		db.setGameAttributes({
			gameOver: false,
			userTid: tid
		},
		function (lid) {
			ui.realtimeUpdate([], helpers.leagueUrl([]));
		});
	}
	function updateTeamSelect() {
        var deferred;
        deferred = $.Deferred();
		g.dbm.transaction("leagues").objectStore("leagues").openCursor(null, "prev").onsuccess = function (event) {
			var teams;
			
			teams = helpers.getTeams(0);
			
			for(var i=0;i<30;i++) {
				teams[i].tid=i;
			}
			
            deferred.resolve({
                teams: teams,
                tid: teams.tid,
                abbrev: teams.abbrev,
                region: teams.region,
                name: teams.name
            });
			
		};
		
		return deferred.promise();
	}

    function uiFirst() {
        ui.title("New Team");
    }

    return bbgmView.init({
        id: "newTeam",
        post: post,
        runBefore: [updateTeamSelect], 
        uiFirst: uiFirst
    });
});