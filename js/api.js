/*These are functions that do not return full pages (either JS objects or partial blocks of HTML) and are called from the client.*/

define(["db", "core/draft", "core/game", "core/season", "util/helpers", "util/lock", "util/playMenu"], function(db, draft, game, season, helpers, lock, playMenu) {
    /*This is kind of a hodgepodge that handles every request from the play
    button and returns the appropriate response in JSON.
    */
    function play(amount) {
        var error = null;
        var url = null;
        var numDays;
/*        var numDays = parseInt(amount, 10)  // Will be NaN is amount is not an integer

        if (numDays >= 0) {
            // Continue playing games
            game.play(numDays)
        }
        else */if (['day', 'week', 'month', 'through_playoffs'].indexOf(amount) >= 0) {
            // Start playing games
            if (amount == 'day') {
                numDays = 1
            }
            else if (amount == 'week') {
                numDays = 7
            }
            else if (amount == 'month') {
                numDays = 30
            }
            else if (amount == 'through_playoffs') {
                numDays = 100  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            }

            game.play(numDays, true)
        }
        else if (amount == 'until_playoffs') {
            if (g.phase < c.PHASE_PLAYOFFS) {
                season.getSchedule(0, function(schedule) {
                    numDays = Math.floor(2 * schedule.length / (g.numTeams));
                    game.play(numDays, true);
                });
            }
        }
        else if (amount == 'stop') {
            helpers.setGameAttributes({stopGames: true});
//            g.dbex('UPDATE schedule SET in_progress_timestamp = 0')

            // This is needed because we can't be sure if (bbgm.core.game.play will be called again
            playMenu.setStatus('Idle');
            lock.set_games_in_progress(false);
            playMenu.refreshOptions();
        }
        else if (amount == 'until_draft') {
            if (g.phase == c.PHASE_BEFORE_DRAFT) {
console.log('hi');
                season.newPhase(c.PHASE_DRAFT);
                draft.generatePlayers();
                draft.setOrder(function () {
                    Davis.location.assign(new Davis.Request("/l/" + g.lid + "/draft"));
                });
            }
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

/*        if (error) {
            alert(error);
        }*/

//        return {url: url};
    }

    function gameLogList(abbrev, season, firstTime, cb) {
        [tid, abbrev] = helpers.validateAbbrev(abbrev);
        season = helpers.validateSeason(season);

        var games = [];
        g.dbl.transaction(["games"]).objectStore("games").index("season").openCursor(IDBKeyRange.only(g.season)).onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var game = cursor.value;

                // Check tid
                var tidMatch = false;
                if (game.teams[0].tid === tid) {
                    tidMatch = true;
                    var home = true;
                    var pts = game.teams[0].pts;
                    var oppPts = game.teams[1].pts;
                    var opp = helpers.validateTid(game.teams[1].tid);
                }
                else if (game.teams[1].tid === tid) {
                    tidMatch = true;
                    var home = false;
                    var pts = game.teams[1].pts;
                    var oppPts = game.teams[0].pts;
                    var opp = helpers.validateTid(game.teams[0].tid);
                }

                if (tidMatch) {
                    if (pts > oppPts) {
                        var won = true;
                    }
                    else {
                        var won = false;
                    }
                    games.push({gid: game.gid, home: home, oppAbbrev: opp[1], won: won, pts: pts, oppPts: oppPts});
                }

                cursor.continue();
            }
            else {
                var template = Handlebars.templates["gameLogList"];
                html = template({games: games});
                cb(html);
            }
        };
    }

    function draftUntilUserOrEnd(cb2) {
        playMenu.setStatus('Draft in progress...');
        var pids = draft.untilUserOrEnd(function (pids) {
            var done = false;
            if (g.phase == c.PHASE_AFTER_DRAFT) {
                done = true;
                playMenu.setStatus('Idle');
            }
            cb2(pids, done);
        });
    }

    function draftUser(pid, cb) {
        pid = parseInt(pid, 10);
        var playerStore = g.dbl.transaction(["players"], IDBTransaction.READ_WRITE).objectStore("players");

        var draftOrder = JSON.parse(localStorage.getItem("league" + g.lid + "DraftOrder"));
        var pick = draftOrder.shift();
        if (pick.tid == g.userTid) {
            draft.selectPlayer(pick, pid, playerStore, cb);
            localStorage.setItem("league" + g.lid + "DraftOrder", JSON.stringify(draftOrder));
        }
        else {
            console.log("ERROR: User trying to draft out of turn.");
        }
    }

    function boxScore(gid, cb) {
        gid = parseInt(gid, 10);

        g.dbl.transaction(["games"]).objectStore("games").get(gid).onsuccess = function(event) {
            var game = event.target.result;

            var template = Handlebars.templates["box_score"];
            html = template({g: g, game: game});
            cb(html);
        };
    }

    return {
        play: play,
        draftUntilUserOrEnd: draftUntilUserOrEnd,
        draftUser: draftUser,
        gameLogList: gameLogList,
        boxScore: boxScore
    };
});
