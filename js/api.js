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

    function gameLogList(abbrev, season, firstTime) {
        abbrev = typeof abbrev !== "undefined" ? abbrev : undefined;
        [tid, abbrev] = helpers.validateAbbrev(abbrev);
        season = typeof season !== "undefined" ? season : undefined;
        season = helpers.validateSeason(season);
        firstTime = typeof season !== "undefined" ? firstTime : false;

        var games = [];
        g.dbl.transaction(["games"]).objectStore("games").index("season").openCursor(IDBKeyRange.only(g.season)).onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var game = cursor.value;
console.log(tid + ' TID ' + game.teams[0].tid + ' TID ' + game.teams[1].tid);
console.log(game);

                // Check tid
                var tidMatch = false;
                if (game.teams[0].tid === tid) {
                    tidMatch = true;
                    var home = true;
                    var pts = game.teams[0].teamStats.pts;
                    var oppPts = game.teams[1].teamStats.pts;
                }
                else if (game.teams[1].tid === tid) {
                    tidMatch = true;
                    var home = false;
                    var pts = game.teams[1].teamStats.pts;
                    var oppPts = game.teams[0].teamStats.pts;
                }

                if (tidMatch) {
                    if (pts > oppPts) {
                        var won = true;
                    }
                    else {
                        var won = false;
                    }
                    games.push({gid: game.gid, home: home, oppAbbrev: "OPP", won: won, pts: pts, oppPts: oppPts});
                }

                cursor.continue();
            }
            else {
                console.log(games);

                var template = Handlebars.templates["gameLogList"];
                $('#game_log_list').html(template({games: games}));

                if (firstTime) {
                    // Click the first one to show its boxscore by default
                    $('#game_log_list tbody tr').first().click();
                }
            }
        };

    }

    return {
        play: play,
        gameLogList: gameLogList
    };
});
