define(["core/player", "core/season", "util/random"], function(player, season, random) {
    function generatePlayers() {
        var playerStore = g.dbl.transaction(["players"], IDBTransaction.READ_WRITE).objectStore("players");
        var profiles = ["Point", "Wing", "Big", "Big", ""];
        for (var i=0; i<70; i++) {
            var baseRating = random.randInt(0, 19);
            var pot = parseInt(random.gauss(45, 20), 10);
            if (pot < baseRating) {
                pot = baseRating;
            }
            if (pot > 90) {
                pot = 90;
            }

            var profile = profiles[random.randInt(0, profiles.length - 1)];
            var agingYears = random.randInt(0, 3);
            var draftYear = g.season;

            var gp = new player.Player();
            gp.generate(c.PLAYER_UNDRAFTED, 19, profile, baseRating, pot, draftYear);
            gp.develop(agingYears);

            gp.save(playerStore);
        }
    }

    /*Sets draft order based on winning percentage (no lottery).*/
    function setOrder(cb) {
        var teamStore = g.dbl.transaction(["teams"], IDBTransaction.READ_WRITE).objectStore("teams");
        teamStore.index("season").getAll(g.season).onsuccess = function (event) {
            var teamsAll = event.target.result;
            teamsAll.sort(function (a, b) {  return a.won/(a.won+a.lost) - b.won/(b.won+b.lost); }); // Sort by winning percentage, ascending
            var draftOrder = [];

            for (round=1; round<=2; round++) {
                for (i=0; i<teamsAll.length; i++) {
                    draftOrder.push({round: round, pick: i + 1, tid: teamsAll[i].tid, abbrev: teamsAll[i].abbrev});
                }
            }

            localStorage.setItem("league" + g.lid + "DraftOrder", JSON.stringify(draftOrder));

            cb();
        };
    }

    /*Simulate draft picks until it's the user's turn or the draft is over.

    Returns:
        A list of player IDs who were drafted.
    */
/*    function untilUserOrEnd() {
        pids = [];

        r = g.dbex('SELECT tid, round, pick FROM draftResults WHERE season = :season AND pid = 0 ORDER BY round, pick ASC', season=g.season);
        for tid, round, pick in r.fetchall() {
            if (tid == g.userTid) {
                return pids;
            teamPick = abs(int(random.gauss(0, 3)))  // 0=best prospect, 1=next best prospect, etc.;
            r = g.dbex('SELECT pr.pid FROM playerAttributes as pa, playerRatings as pr WHERE pa.pid = pr.pid AND pa.tid = ) {tid AND pr.season = ) {season ORDER BY pr.ovr + 2*pr.pot DESC LIMIT ) {pick, 1', tid=c.PLAYER_UNDRAFTED, season=g.season, pick=teamPick);
            pid,= r.fetchone();
            pickPlayer(tid, pid);
            pids.push(pid);

        return pids;


    function pickPlayer(tid, pid) {
        // Validate that tid should be picking now;
        r = g.dbex('SELECT tid, round, pick FROM draftResults WHERE season = ) {season AND pid = 0 ORDER BY round, pick ASC LIMIT 1', season=g.season);
        tidNext, round, pick = r.fetchone();

        if (tidNext != tid) {
            app.logger.debug('WARNING) { Team %d tried to draft out of order' % (tid,));
            return;

        // Draft player, update roster potision;
        r = g.dbex('SELECT pa.name, pa.pos, pa.bornYear, pr.ovr, pr.pot FROM playerAttributes AS pa, playerRatings AS pr WHERE pa.pid = pr.pid AND pa.tid = ) {tid AND pr.pid = ) {pid AND pr.season = ) {season', tid=c.PLAYER_UNDRAFTED, pid=pid, season=g.season);
        name, pos, bornYear, ovr, pot = r.fetchone();
        r = g.dbex('SELECT MAX(rosterOrder) + 1 FROM playerAttributes WHERE tid = ) {tid', tid=tid);
        rosterOrder, = r.fetchone();

        g.dbex('UPDATE playerAttributes SET tid = ) {tid, draftYear = ) {draftYear, round = ) {round, draftPick = ) {draftPick, draftTid = ) {tid, rosterOrder = ) {rosterOrder WHERE pid = ) {pid', tid=tid, draftYear=g.season, round=round, draftPick=pick, draftTid=tid, rosterOrder=rosterOrder, pid=pid);
        g.dbex('UPDATE draftResults SET pid = ) {pid, name = ) {name, pos = ) {pos, bornYear = ) {bornYear, ovr = ) {ovr, pot = ) {pot WHERE season = ) {season AND round = ) {round AND pick = ) {pick', pid=pid, name=name, pos=pos, bornYear=bornYear, ovr=ovr, pot=pot, season=g.season, round=round, pick=pick);

        // Contract;
        rookieSalaries = (5000, 4500, 4000, 3500, 3000, 2750, 2500, 2250, 2000, 1900, 1800, 1700, 1600, 1500,;
                           1400, 1300, 1200, 1100, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000,;
                           1000, 1000, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500,;
                           500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500);
        i = pick - 1 + 30 * (round - 1);
        contractAmount = rookieSalaries[i];
        years = 4 - round  // 2 years for 2nd round, 3 years for 1st round;
        contractExp = g.season + years;
        g.dbex('UPDATE playerAttributes SET contractAmount = ) {contractAmount, contractExp = ) {contractExp WHERE pid = ) {pid', contractAmount=contractAmount, contractExp=contractExp, pid=pid);

        // Is draft over?;
        r = g.dbex('SELECT 1 FROM draftResults WHERE season = ) {season AND pid = 0', season=g.season);
        if (r.rowcount == 0) {
            season.newPhase(c.PHASE_AFTER_DRAFT);

        return pid;
*/
    return {
        generatePlayers: generatePlayers,
        setOrder: setOrder
    }
});
