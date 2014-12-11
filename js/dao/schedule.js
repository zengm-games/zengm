define(["db", "globals", "lib/bluebird"], function (db, g, Promise) {
    "use strict";


    /**
     * Get an array of games from the schedule.
     * 
     * @param {(IDBObjectStore|IDBTransaction|null)} options.ot An IndexedDB object store or transaction on schedule; if null is passed, then a new transaction will be used.
     * @param {boolean} options.oneDay Number of days of games requested. Default false.
     * @return {Promise} Resolves to the requested schedule array.
     */
    function get(options) {
        options = options !== undefined ? options : {};
        options.oneDay = options.oneDay !== undefined ? options.oneDay : false;

        return new Promise(function (resolve, reject) {
            var scheduleStore;

            scheduleStore = db.getObjectStore(options.ot, "schedule", "schedule");
            scheduleStore.getAll().onsuccess = function (event) {
                var i, schedule, tids;

                schedule = event.target.result;

                if (options.oneDay) {
                    schedule = schedule.slice(0, g.numTeams / 2);  // This is the maximum number of games possible in a day

                    // Only take the games up until right before a team plays for the second time that day
                    tids = [];
                    for (i = 0; i < schedule.length; i++) {
                        if (tids.indexOf(schedule[i].homeTid) < 0 && tids.indexOf(schedule[i].awayTid) < 0) {
                            tids.push(schedule[i].homeTid);
                            tids.push(schedule[i].awayTid);
                        } else {
                            break;
                        }
                    }
                    schedule = schedule.slice(0, i);
                }

                resolve(schedule);
            };
        });
    }

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
        get: get,
        set: set
    };
});