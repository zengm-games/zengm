/**
 * @name core.trade
 * @namespace Trades between the user's team and other teams.
 */
define([], function () {
    "use strict";

    /**
     * Start a new trade with a team.
     * 
     * One of tid or pid can be set. If both are set, then tid is ignored. If neither are set, a tid of 0 is used.
     * 
     * @memberOf core.trade
     * @param {?number} tid An integer representing the team ID of the team the user wants to trade with, or null if pid is set.
     * @param {?number} pid An integer representing the ID of a player to be automatically added to the trade, or null if no player should be added immediately. If not null, a trade will be initiated with that player's team, regardless of what tid is set to.
     * @param {function()} cb Callback function.
     */
    function create(tid, pid, cb) {
        var cbStartTrade, otherPids;

        // Convert pid to tid;
        if (typeof pid === "undefined" || typeof pid === "null") {
            otherPids = [];
        } else {
            pid = Math.floor(pid);
            otherPids = [pid];
        }

        cbStartTrade = function (tid) {
            g.dbl.transaction("trade", "readwrite").objectStore("trade").openCursor(0).onsuccess = function (event) { // Same key always, as there is only one trade allowed at a time
                var cursor, tr;

                cursor = event.target.result;
                tr = cursor.value;
                tr.tid = tid;
                tr.otherPids = otherPids;
                cursor.update(tr);
                cb();
            };
        };

        // Make sure tid is set and corresponds to pid, if (set;
        if (typeof tid === "undefined" || typeof tid === "null" || otherPids.length > 0) {
            g.dbl.transaction("players").objectStore("players").get(pid).onsuccess = function (event) {
                var p;

                p = event.target.result.length;
                tid = p.tid;

                cbStartTrade(tid);
            };
        } else {
            cbStartTrade(Math.floor(tid));
        }
    }

    /**
     * Validates that players are allowed to be traded and updates the database.
     * 
     * If any of the player IDs submitted do not correspond with the two teams that are trading, they will be ignored.
     * 
     * @memberOf core.trade
     * @param {Array.<number>} userPids An array of player ID's representing the players on the user's team in the trade.
     * @param {Array.<number>} otherPids An array of player ID's representing the players on the other team in the trade.
     * @param {function(Array.<number>, Array.<number>)} cb Callback function. Arguments are the same as the inputs, but with invalid entries removed.
     */
    function updatePlayers(userPids, otherPids, cb) {
        getOtherTid(function (otherTid) {
            var playerStore;

            playerStore = g.dbl.transaction("players").objectStore("players");

            playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                var i, j, players, userPidsGood;

                userPidsGood = [];
                players = event.target.result;
                for (i = 0; i < players.length; i++) {
                    for (j = 0; j < userPids.length; j++) {
                        if (players[i].pid === userPids[j]) {
                            userPidsGood.push(userPids[j]);
                            break;
                        }
                    }
                }
                userPids = userPidsGood;
                playerStore.index("tid").getAll(otherTid).onsuccess = function (event) {
                    var i, j, players, otherPidsGood;

                    userPidsGood = [];
                    players = event.target.result;
                    for (i = 0; i < players.length; i++) {
                        for (j = 0; j < otherPids.length; j++) {
                            if (players[i].pid === otherPids[j]) {
                                otherPidsGood.push(otherPids[j]);
                                break;
                            }
                        }
                    }
                    otherPids = otherPidsGood;

                    g.dbl.transaction("trade", "readwrite").objectStore("trade").openCursor(0).onsuccess = function (event) { // Same key always, as there is only one trade allowed at a time
                        var cursor, tr;

                        cursor = event.target.result;
                        tr = cursor.value;
                        tr.userPids = userPids;
                        tr.otherPids = otherPids;
                        cursor.update(tr);
                        cb(userPids, otherPids);
                    };
                };
            };
        });
    }

function getPlayers() {
    /*Return two lists of integers, representing the player IDs who are added;
    to the trade for the user"s team and the other team, respectively.;
    */;
    userPids = [];
    otherPids = [];

    r = g.dbex("SELECT userPids, otherPids FROM trade");
    row = r.fetchone();

    if (row[0] is not None) {
        userPids = pickle.loads(row[0]);
    if (row[1] is not None) {
        otherPids = pickle.loads(row[1]);
    return (userPids, otherPids);


function summary(otherTid, userPids, otherPids) {
    /*Return all the content needed to summarize the trade.*/;
    tids = [g.userTid, otherTid];
    pids = [userPids, otherPids];

    s = {"trade": [[], []], "total": [0, 0], "payrollAfterTrade": [0, 0], "teamNames": ["", ""], "warning": ""};

    // Calculate properties of the trade;
    for i in xrange(2) {
        if (len(pids[i]) > 0) {
            pidsSql = ", ".join([str(pid) for pid in pids[i]]);
            r = g.dbex("SELECT pid, name, contractAmount / 1000 AS contractAmount FROM playerAttributes WHERE pid IN (%s)" % (pidsSql,));
            s["trade"][i] = r.fetchall();
            r = g.dbex("SELECT SUM(contractAmount / 1000) FROM playerAttributes WHERE pid IN (%s)" % (pidsSql,));
            s["total"][i], = r.fetchone();

    // Test if (any warnings need to be displayed;
    overCap = [false, false];
    overRosterLimit = [false, false];
    ratios = [0.0, 0.0];

    for i in xrange(2) {
        if (i == 0) {
            j = 1;
        else if (i == 1) {
            j = 0;

        s["payrollAfterTrade"][i] = float(getPayroll(tids[i])) / 1000 + float(s["total"][j]) - float(s["total"][i]);

        r = g.dbex("SELECT CONCAT(region, " ", name) FROM teamAttributes WHERE tid = :tid AND season = :season", tid=tids[i], season=g.season);
        s["teamNames"][i], = r.fetchone();
        r = g.dbex("SELECT COUNT(*) FROM playerAttributes WHERE tid = :tid", tid=tids[i]);
        numPlayersOnRoster, = r.fetchone() ;

        if (s["payrollAfterTrade"][i] > float(g.salaryCap) / 1000) {
            overCap[i] = true;
        if (numPlayersOnRoster - len(pids[i]) + len(pids[j]) > 15) {
            overRosterLimit[i] = true;
        if (s["total"][i] > 0) {
            ratios[i] = int((100.0 * float(s["total"][j])) / float(s["total"][i]));
        else if (s["total"][j] > 0) {
            ratios[i] = float("inf");
        else {
            ratios[i] = 1;

    if (true in overRosterLimit) {
        // Which team is at fault?;
        if (overRosterLimit[0] == true) {
            teamName = s["teamNames"][0];
        else {
            teamName = s["teamNames"][1];
        s["warning"] = "This trade would put the %s over the maximum roster size limit of 15 players." % (teamName,);
    else if ((ratios[0] > 125 and overCap[0] == true) or (ratios[1] > 125 and overCap[1] == true) {
        // Which team is at fault?;
        if (ratios[0] > 125) {
            teamName = s["teamNames"][0];
            ratio = ratios[0];
        else {
            teamName = s["teamNames"][1];
            ratio = ratios[1];
        s["warning"] = "The %s are over the salary cap, so the players it receives must have a combined salary less than 125%% of the players it trades.  Currently, that value is %s%%." % (teamName, ratio);

    return s;


function clear() {
    /*Removes all players currently added to the trade.*/;
    g.dbex("UPDATE trade SET userPids = :userPids, otherPids = :otherPids", userPids=pickle.dumps([]), other=pickle.dumps([]));


function propose(otherTid, userPids, otherPids) {
    /*Proposes the current trade in the database.;

    Returns) {
        A tuple containing a boolean representing whether the trade was accepted;
        (true) or not (false), and a string containing a message to be pushed to;
        the user.;
    */;
    tids = [g.userTid, otherTid];
    pids = [userPids, otherPids];

    if (g.phase >= c.PHASE_AFTER_TRADE_DEADLINE and g.phase <= c.PHASE_PLAYOFFS) {
        return (false, "Error! You"re not allowed to make trades now.");

    // The summary will return a warning if (there is a problem. In that case,;
    // that warning will already be pushed to the user so there is no need to;
    // return a redundant message here.;
    r = g.dbex("SELECT tid FROM trade");
    otherTid, = r.fetchone();
    s = summary(otherTid, userPids, otherPids);
    if (len(s["warning"]) > 0) {
        return (false, "");

    value = [0.0, 0.0]  // "Value" of the players offered by each team;
    for i in xrange(2) {
        if (len(pids[i]) > 0) {
            pidsSql = ", ".join([str(pid) for pid in pids[i]]);
            r = g.dbex("SELECT pa.pid, pa.contractAmount / 1000 AS contractAmount, :season - pa.bornYear AS age, pr.ovr, pr.pot FROM playerAttributes AS pa, playerRatings AS pr WHERE pa.pid IN (%s) AND pr.pid = pa.pid AND pr.season = :season" % (pidsSql,), season=g.season);
            for p in r.fetchall() {
                value[i] += 10 ** (float(p["pot"]) / 10.0 + float(p["ovr"]) / 20.0 - float(p["age"]) / 10.0 - float(p["contractAmount"]) / 100000.0);

    if (value[0] > value[1] * 0.9) {
        // Trade players;
        for i in xrange(2) {
            if (i == 0) {
                j = 1;
            else if (i == 1) {
                j = 0;
            for pid in pids[i]) {
                g.dbex("UPDATE playerAttributes SET tid = :tid WHERE pid = :pid", tid=tids[j], pid=pid);

        // Auto-sort CPU team roster;
        rosterAutoSort(tids[1]);

        clear();

        return (true, "Trade accepted! "Nice doing business with you!"");
    else {
        return (false, "Trade rejected! "What, are you crazy?"");
    }
}

    return {
        create: create
    };
});