/**
 * @name core.freeAgents
 * @namespace Functions related to free agents that didn't make sense to put anywhere else.
 */
define([], function () {
    "use strict";

    /**
     * AI teams sign free agents.
     * 
     * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
     *
     * @memberOf core.freeAgents
     * @param {function()} cb Callback.
     */
    function autoSign(cb) {
        var transaction;

        /*transaction = g.dbl.transaction(["players", "releasedPlayers"], IDBTransaction.READ_WRITE);

        transaction.objectStore("players").index("tid").getAll(c.PLAYER_FREE_AGENT).onsuccess = function (event) {

        };*/
/*        // Build freeAgents containing player ids and desired contracts
        freeAgents = [];
        r = g.dbex("SELECT pa.pid, pa.contractAmount, pa.contractExp FROM playerAttributes as pa, playerRatings as pr WHERE pa.tid = :tid AND pa.pid = pr.pid AND pr.season = :season ORDER BY pr.ovr + 2*pr.pot DESC", tid=c.PLAYER_FREE_AGENT, season=g.season);
        for pid, amount, expiration in r.fetchall() {
            freeAgents.push([pid, amount, expiration, false]);

        // Randomly order teams and let them sign free agents
        tids = list(xrange(30));
        random.shuffle(tids);
        for i in xrange(30) {
            tid = tids[i];

            if (tid == g.userTid) {
                continue;  // Skip the user"s team

            r = g.dbex("SELECT count(*) FROM playerAttributes WHERE tid = :tid", tid=tid);
            numPlayers, = r.fetchone();
            payroll = getPayroll(tid);
            while payroll < g.salaryCap and numPlayers < 15) {
                j = 0;
                newPlayer = false;
                for pid, amount, expiration, signed in freeAgents) {
                    if (amount + payroll <= g.salaryCap and not signed and numPlayers < 15) {
                        g.dbex("UPDATE playerAttributes SET tid = :tid, contractAmount = :contractAmount, contractExp = :contractExp WHERE pid = :pid", tid=tid, contractAmount=amount, contractExp=expiration, pid=pid);
                        freeAgents[j][-1] = true;  // Mark player signed
                        newPlayer = true;
                        numPlayers += 1;
                        payroll += amount;
                        rosterAutoSort(tid);
                    j += 1;
                if (not newPlayer) {
                    break;*/
        cb();
    }

    /**
     * Decrease contract demands for all free agents.
     *
     * This is called after each day in the regular season, as free agents become more willing to take smaller contracts.
     * 
     * @memberOf core.freeAgents
     * @param {function()} cb Callback.
     */
    function decreaseDemands(cb) {
        g.dbl.transaction("players", IDBTransaction.READ_WRITE).objectStore("players").index("tid").openCursor(c.PLAYER_FREE_AGENT).onsuccess = function (event) {
            var cursor, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                // Decrease free agent demands
                p.contractAmount -= 50;
                if (p.contractAmount < 500) {
                    p.contractAmount = 500;
                }
                // Since this is called after the season has already started, ask for a short contract
                if (p.contractAmount < 1000) {
                    p.contractExp = g.season;
                } else {
                    p.contractExp = g.season + 1;
                }

                // Free agents' resistance to previous signing attempts by player decays
                // Decay by 0.1 per game, for 82 games in the regular season
                p.freeAgentTimesAsked -= 0.1;
                if (p.freeAgentTimesAsked < 0) {
                    p.freeAgentTimesAsked = 0;
                }

                cursor.update(p);
                cursor.continue();
            } else {
                cb();
            }
        };
    }

    return {
        autoSign: autoSign,
        decreaseDemands: decreaseDemands
    };
});