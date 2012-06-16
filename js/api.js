/*These are functions that do not return full pages (either JS objects or partial blocks of HTML) and are called from the client.*/

define(["db", "core/game", "util/helpers", "util/lock", "util/playMenu"], function(db, game, helpers, lock, playMenu) {
    /*This is kind of a hodgepodge that handles every request from the play
    button and returns the appropriate response in JSON.
    */
    function play(amount) {
        var error = null;
        var url = null;
        var numDays = parseInt(amount, 10)  // Will be NaN is amount is not an integer

        if (numDays >= 0) {
            // Continue playing games
            game.play(numDays)
        }
        else if (['day', 'week', 'month', 'until_playoffs', 'through_playoffs'].indexOf(amount) >= 0) {
            // Start playing games
            start = true

            if (amount == 'day') {
                numDays = 1
            }
            else if (amount == 'week') {
                numDays = 7
            }
            else if (amount == 'month') {
                numDays = 30
            }
            else if (amount == 'until_playoffs') {
                r = g.dbex('SELECT COUNT(*)/:num_teams FROM team_stats WHERE season = :season', num_teams=g.num_teams, season=g.season)
                row = r.fetchone()
                numDays = int(g.season_length - row[0])  // Number of days remaining
            }
            else if (amount == 'through_playoffs') {
                numDays = 100  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            }

            game.play(numDays, start)
        }
        else if (amount == 'stop') {
//            g.dbex('UPDATE game_attributes SET stop_games = TRUE WHERE season = :season', season=g.season)
//            g.dbex('UPDATE schedule SET in_progress_timestamp = 0')

            // This is needed because we can't be sure if (bbgm.core.game.play will be called again
            playMenu.setStatus('Idle');
            lock.setGamesInProgress(false);
            playMenu.refreshOptions();
        }
        else if (amount == 'until_draft') {
            if (g.phase == c.PHASE_BEFORE_DRAFT) {
//                season.new_phase(c.PHASE_DRAFT)
//                draft.generate_players()
//                draft.set_order()
            }
//            url = url_for('draft_', lid=g.lid)
        }
        else if (amount == 'until_resign_players') {
            if (g.phase == c.PHASE_AFTER_DRAFT) {
//                season.new_phase(c.PHASE_RESIGN_PLAYERS);
//            url = url_for('negotiation_list', lid=g.lid)
            }
        }
        else if (amount == 'until_free_agency') {
            if (g.phase == c.PHASE_RESIGN_PLAYERS) {
//                season.new_phase(c.PHASE_FREE_AGENCY);
                playMenu.setStatus('Idle')
//            url = url_for('free_agents', lid=g.lid)
            }
        }
        else if (amount == 'until_preseason') {
            if (g.phase == c.PHASE_FREE_AGENCY) {
//                season.new_phase(c.PHASE_PRESEASON);
            }
        }
        else if (amount == 'until_regular_season') {
            if (g.phase == c.PHASE_PRESEASON) {
//                error = season.new_phase(c.PHASE_REGULAR_SEASON);
            }
        }

        if (error) {
            alert(error);
        }

//        return {url: url};
    }

    function gameLogList(abbrev, season) {
        var season = typeof req.params.season !== "undefined" ? req.params.season : undefined;
        season = helpers.validateSeason(season);
        var abbrev = typeof req.params.abbrev !== "undefined" ? req.params.abbrev : undefined;
        [tid, abbrev] = helpers.validateAbbrev(abbrev)

        g.dbl.transaction(["games"]).objectStore("games").index("tid").get(tid).onsuccess = function(event) { console.log(event.target.result) };

//        r = g.dbex('SELECT gid, home, (SELECT abbrev FROM team_attributes WHERE tid = opp_tid AND season = :season) as opponent_abbrev, won, pts, opp_pts FROM team_stats WHERE tid = :tid AND season = :season', season=season, tid=tid)
//        games = r.fetchall()

        var template = Handlebars.templates["gameLogList"];
//        return template({games: games});
    }

    return {
        play: play,
        gameLogList: gameLogList
    };
});
