define(["globals", "lib/bluebird"], function (g, Promise) {
    "use strict";

    /**
     * Save the schedule to the database, overwriting what's currently there.
     * 
     * @param {Array} tids A list of lists, each containing the team IDs of the home and
            away teams, respectively, for every game in the season, respectively.
     * @return {Promise}
     */
    function set(tids) {
        return new Promise(function (resolve, reject) {
            var i, row, schedule, scheduleStore, tx;

            schedule = [];
            for (i = 0; i < tids.length; i++) {
                row = {homeTid: tids[i][0], awayTid: tids[i][1]};
                schedule.push(row);
            }

            tx = g.dbl.transaction("schedule", "readwrite");
            scheduleStore = tx.objectStore("schedule");
            scheduleStore.getAll().onsuccess = function (event) {
                var currentSchedule, i;

                currentSchedule = event.target.result;
                for (i = 0; i < currentSchedule.length; i++) {
                    scheduleStore.delete(currentSchedule[i].gid);
                }

                for (i = 0; i < schedule.length; i++) {
                    scheduleStore.add(schedule[i]);
                }
            };
            tx.oncomplete = function () {
                resolve();
            };
        });
    }

    return {
        set: set
    };
});