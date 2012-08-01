importScripts('../lib/require.js');

require({baseUrl: "../"}, ["core/gameSim"], function(gameSim) {
    "use strict";

    self.addEventListener('message', function(e) {
        var gs, i, results, schedule, teams;

        schedule = e.data.schedule;
        teams = e.data.teams;
        results = [];

        for (i = 0; i < schedule.length; i++) {
            gs = new gameSim.GameSim(schedule[i].gid, teams[schedule[i].homeTid], teams[schedule[i].awayTid]);
            results.push(gs.run());
        }
        self.postMessage(results);
    }, false);
});



