define(["util/random"], function(random) {
    /*Start a new contract negotiation with player.

    Args:
        pid: An integer that must correspond with a free agent.
        resigning: A boolean. True if (this is a negotiation for a contract
            extension with a current player who just became a free agent. False
            otherwise.;

    Returns:
        False if (the new negotiation is started successfully. Otherwise, it
        returns a string containing an error message to be sent to the user.
    */
    function new(pid, resigning) {
        console.log("Trying to start new contract negotiation with player %d" % (pid,));

        resigning = typeof resigning !== "undefined" ? resigning : false;

        if ((g.phase >= c.PHASE_AFTER_TRADE_DEADLINE && g.phase <= c.PHASE_AFTER_DRAFT) && !resigning) {
            return "You're not allowed to sign free agents now.";
        }
        r = g.dbex("SELECT COUNT(*) FROM playerAttributes WHERE tid = :tid", tid=g.userTid);
        numPlayersOnRoster, = r.fetchone();
        if (numPlayersOnRoster >= 15 && !resigning) {
            return "Your roster is full. Before you can sign a free agent, you'll have to buy out or release one of your current players.";
        }
        if (not lock.canStartNegotiation() {
            return "You cannot initiate a new negotiaion while game simulation is in progress or a previous contract negotiation is in process.";
        }
        r = g.dbex("SELECT tid FROM playerAttributes WHERE pid = :pid", pid = pid);
        if (r.rowcount) {
            tid, = r.fetchone();
            if (tid !== c.PLAYER_FREE_AGENT) {
                return "Player %d is not a free agent." % (pid,);
            }
        }
        else {
            return "Player %d does not exist." % (pid,);
        }

        // Initial player proposal;
        r = g.dbex("SELECT contractAmount*(1+freeAgentTimesAsked/10), contractExp FROM playerAttributes WHERE pid = :pid", pid = pid);
        playerAmount, expiration = r.fetchone();
        playerYears = expiration - g.season;
        // Adjust to account for in-season signings;
        if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
            playerYears += 1;
        }

        maxOffers = random.randInt(1, 5);

        g.dbex("INSERT INTO negotiations (pid, teamAmount, teamYears, playerAmount, playerYears, numOffersMade, maxOffers, resigning) VALUES (:pid, :playerAmount, :playerYears, :playerAmount, :playerYears, 0, :maxOffers, :resigning)", pid=pid, playerAmount=playerAmount, playerYears=playerYears, maxOffers=maxOffers, resigning=resigning);
        playMenu.setStatus("Contract negotiation in progress...");
        playMenu.refreshOptions();

        // Keep track of how many times negotiations happen with a player;
        if (!resigning) {
            g.dbex("UPDATE playerAttributes SET freeAgentTimesAsked = freeAgentTimesAsked + 1 WHERE pid = :pid", pid = pid);
        }

        return false;

    /*Make an offer to a player.

    pid must correspond with an ongoing negotiation.
    */
    function offer(pid, teamAmount, teamYears) {
        console.log("User made contract offer for %d over %d years to %d" % (teamAmount, teamYears, pid));

        if (teamAmount > 20000) {
            teamAmount = 20000;
        if (teamYears > 5) {
            teamYears = 5;
        if (teamAmount < 500) {
            teamAmount = 500;
        if (teamYears < 1) {
            teamYears = 1;

        r = g.dbex("SELECT playerAmount, playerYears, numOffersMade, maxOffers FROM negotiations WHERE pid = :pid", pid = pid);
        playerAmount, playerYears, numOffersMade, maxOffers = r.fetchone();

        numOffersMade += 1;
        if (numOffersMade <= maxOffers) {
            if (teamYears < playerYears) {
                playerYears -= 1;
                playerAmount *= 1.2;
            }
            else if (teamYears > playerYears) {
                playerYears += 1;
                playerAmount *= 1.2;
            }
            if (teamAmount < playerAmount and teamAmount > 0.7 * playerAmount) {
                playerAmount = .75 * playerAmount + .25 * teamAmount;
            }
            else if (teamAmount < playerAmount) {
                playerAmount *= 1.1;
            }
            if (teamAmount > playerAmount) {
                playerAmount = teamAmount;
            }
        }
        else {
            playerAmount = 1.05 * playerAmount;
        }

        if (playerAmount > 20000) {
            playerAmount = 20000;
        }
        if (playerYears > 5) {
            playerYears = 5;
        }

        g.dbex("UPDATE negotiations SET teamAmount = :teamAmount, teamYears = :teamYears, playerAmount = :playerAmount, playerYears = :playerYears, numOffersMade = :numOffersMade WHERE pid = :pid", teamAmount=teamAmount, teamYears=teamYears, playerAmount=playerAmount, playerYears=playerYears, numOffersMade=numOffersMade, pid=pid);

    /*Accept the player"s offer.

    pid must correspond with an ongoing negotiation.

    Returns False if (everything works. Otherwise, a string containing an error
    message (such as "over the salary cap") is returned.
    */
    function accept(pid) {
        console.log("User accepted contract proposal from " + pid);

        r = g.dbex("SELECT playerAmount, playerYears, resigning FROM negotiations WHERE pid = :pid", pid = pid);
        playerAmount, playerYears, resigning = r.fetchone();

        // If this contract brings team over the salary cap, it"s not a minimum;
        // contract, and it"s not resigning a current player, ERROR!;
        payroll = getPayroll(g.userTid);
        if (!resigning && (payroll + playerAmount > g.salaryCap && playerAmount !== 500) {
            return "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract, buy out a player currently on your roster, or cancel the negotiation.";
        }

        // Adjust to account for in-season signings;
        if (g.phase <= c.PHASE_AFTER_TRADE_DEADLINE) {
            playerYears -= 1;
        }

        r = g.dbex("SELECT MAX(rosterOrder) + 1 FROM playerAttributes WHERE tid = :tid", tid = g.userTid);
        rosterOrder, = r.fetchone();

        g.dbex("UPDATE playerAttributes SET tid = :tid, contractAmount = :contractAmount, contractExp = :contractExp, rosterOrder = :rosterOrder WHERE pid = :pid", tid=g.userTid, contractAmount=playerAmount, contractExp=g.season + playerYears, rosterOrder=rosterOrder, pid=pid);

        g.dbex("DELETE FROM negotiations WHERE pid = :pid", pid = pid);
        playMenu.setStatus("Idle");
        playMenu.refreshOptions();

        return false;

    /*Cancel contract negotiations with a player.

    pid must correspond with an ongoing negotiation.
    */
    function cancel(pid) {
        console.log("User canceled contract negotiations with " + pid);

        // Delete negotiation;
        g.dbex("DELETE FROM negotiations WHERE pid = :pid", pid = pid);

        // If no negotiations are in progress, update status;
        if (not lock.negotiationInProgress() {
            playMenu.setStatus("Idle");
            playMenu.refreshOptions();
        }

    /*Cancel all ongoing contract negotiations.

    As of the time that I"m writing this, the only time there should be multiple
    ongoing negotiations in the first place is when a user is resigning players
    at the end of the season, although that should probably change eventually.
    */
    function cancelAll() {
        console.log("Canceling all ongoing contract negotiations...");

        // If no negotiations are in progress, update status;
        r = g.dbex("SELECT pid FROM negotiations");
        for pid, in r.fetchall() {
            cancel(pid);
        }
    }

    return {

    };
}
