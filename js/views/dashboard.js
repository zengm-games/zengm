/**
 * @name views.dashboard
 * @namespace Dashboard.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function updateDashboard(inputs, updateEvents) {
        var deferred;

        deferred = $.Deferred();

        g.dbm.transaction("leagues").objectStore("leagues").getAll().onsuccess = function (event) {
            var data, i, leagues, teams;

            leagues = event.target.result;
	        var tx = g.dbl.transaction("teams")
	        var teamStore = tx.objectStore("teams");
	        var teamNameArray=[];
	        for(var a=0;a<30;a++){
	        	var object=teamStore.getAll(a);
	        	object.onsuccess=function(event){
	        		var currTeam=event.target.result;
	        		var newObjTeam={name: currTeam[0].name};
	        		teamNameArray.push(newObjTeam);
	        		//console.log(currTeam[0].name)
	        	}
	        }
	        teams = helpers.getTeams(undefined,teamNameArray);

            for (i = 0; i < leagues.length; i++) {
                leagues[i].region = teams[leagues[i].tid].region;
                leagues[i].teamName = teams[leagues[i].tid].name;
                delete leagues[i].tid;
            }

            deferred.resolve({
                leagues: leagues
            });
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Dashboard");
    }

    return bbgmView.init({
        id: "dashboard",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateDashboard],
        uiFirst: uiFirst
    });
});