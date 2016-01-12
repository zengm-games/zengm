'use strict';

var db = require('./db');
var views = require('./views');
var ui = require('./ui');
var changes = require('./data/changes');
var Davis = require('./lib/davis');
var account = require('./util/account');
var helpers = require('./util/helpers');

// Make sure I never accidentally use native promises, because that could fuck with error handling
window.Promise = function () { throw new Error("USE BLUEBIRD!"); };
window.Promise.all = function () { throw new Error("USE BLUEBIRD!"); };
window.Promise.map = function () { throw new Error("USE BLUEBIRD!"); };
window.Promise.try = function () { throw new Error("USE BLUEBIRD!"); };

require('lib/bootstrap-affix');
require('lib/bootstrap-alert');
require('lib/bootstrap-collapse');
require('lib/bootstrap-dropdown');
require('lib/bootstrap-modal');
require('lib/bootstrap-popover');
require('./lib/davis.google_analytics');
require('indexeddb-getall-shim');
require('lib/jquery.barGraph');
require('lib/jquery.dataTables');
require('lib/jquery.dataTables.bbgmSorting');
require('lib/jquery.dataTables.bootstrap');
require('jquery-ui/sortable');
require('jquery-ui-touch-punch');
require('./util/templateHelpers');
require('./api');

(function () {
    var errorMsg;

    // If we're in debug mode, make debug functions available
    if (localStorage.debug === "debug") {
        window.bbgm = {
            debug: require('./core/debug'),
            dao: require('./dao'),
            g: require('./globals'),
            contractNegotiation: require('./core/contractNegotiation'),
            draft: require('./core/draft'),
            finances: require('./core/finances'),
            freeAgents: require('./core/freeAgents'),
            game: require('./core/game'),
            gameSim: require('./core/gameSim'),
            phase: require('./core/phase'),
            player: require('./core/player'),
            season: require('./core/season'),
            team: require('./core/team'),
            trade: require('./core/trade')
        };
    }

    ui.init();

    // Browser compatibility checks!

    // Check if this is an old browser without IndexedDB support
    if (typeof indexedDB === "undefined") { // Some browsers don't like just plain "indexedDB === undefined"
        errorMsg = '<p>Your browser is not modern enough to run Basketball GM. <a href="http://www.firefox.com/">Mozilla Firefox</a> and <a href="http://www.google.com/chrome/">Google Chrome</a> work best.</p>';

        // Special error for Apple's mobile devices, as that's the only platform that is totally unsupported (no alternative browser to install)
        if (/(iPad|iPhone|iPod)/.test(navigator.userAgent)) {
            errorMsg += '<p>If you\'re on an iPhone/iPad/iPod, there is currently no way to run Basketball GM. Please come back on a desktop/laptop or a non-Apple mobile device!</p>';
        }

        return helpers.error(errorMsg);
    }

    // Check for Safari (would like to feature detect, but it's so fucking buggy I don't know where to begin, and I don't even have a Mac)
    // https://developer.mozilla.org/en-US/docs/Browser_detection_using_the_user_agent
    if (navigator.userAgent.indexOf("Safari") >= 0 && navigator.userAgent.indexOf("Chrome") < 0) {
        errorMsg = '<p>Your browser is not modern enough to run Basketball GM. <a href="http://www.firefox.com/">Mozilla Firefox</a> and <a href="http://www.google.com/chrome/">Google Chrome</a> work best.</p>';

        // Special error for Apple's mobile devices, as that's the only platform that is totally unsupported (no alternative browser to install)
        if (/(iPad|iPhone|iPod)/.test(navigator.userAgent)) {
            errorMsg += '<p>If you\'re on an iPhone/iPad/iPod, there is currently no way to run Basketball GM. Please come back on a desktop/laptop or a non-Apple mobile device! And complain to Apple to fix IndexedDB if you want to play Basketball GM on your iDevice.</p>';
        }

        return helpers.error(errorMsg);
    }

    // IE10 and IE11 don't work because they lack support for compound indexes
    try {
        // Feature detection! http://stackoverflow.com/a/26779525/786644
        IDBKeyRange.only([1]);
    } catch (e) {
    //        errorMsg = '<p>Your browser is not modern enough to run Basketball GM. <a href="http://www.firefox.com/">Mozilla Firefox</a> and <a href="http://www.google.com/chrome/">Google Chrome</a> work best.</p>';
    //
    //        return helpers.error(errorMsg);
        return window.location.replace("/export_3.3");
    }

    // NaN detection
    helpers.checkNaNs();

    // Any news?
    changes.check();

    db.connectMeta().then(function () {
        var app = new Davis(function () {
            var tryForceHttps;

            this.configure(function () {
                this.generateRequestOnPageLoad = true;
                this.handleRouteNotFound = true;
                this.linkSelector = "a:not([data-no-davis=true])";
                this.formSelector = "form:not([data-no-davis=true])";
            });

            this.use(Davis.googleAnalytics);

            this.before(function (req) {
                if (window.inCordova) {
                    // Normal Cordova pages
                    if (req.path.substr(0, 7) === 'file://') {
                        req.path = req.path.substr(7);
                    }

                    // First load Cordova page
                    if (req.path.indexOf("/index.html") >= 0) {
                        req.path = "/";
                    }
                }
            });

            this.bind("routeNotFound", function (req) {
                helpers.error("Page not found.", req.raw.cb);
            });

            // Redirect a route to https URL always, unless the URL doesn't include basketball-gm (e.g. localhost)
            tryForceHttps = function (view) {
                return function (req) {
                    if (window.location.protocol === "http:" && window.location.hostname.indexOf("basketball-gm") >= 0) {
                        window.location.replace("https://" + window.location.hostname + req.fullPath);
                    } else {
                        view(req);
                    }
                };
            };

            // Non-league views
            this.get("/", views.dashboard.get);
            this.get("/new_league", tryForceHttps(views.newLeague.get));
            this.post("/new_league", views.newLeague.post);
            this.get("/delete_league/:lid", views.deleteLeague.get);
            this.post("/delete_league", views.deleteLeague.post);
            this.get("/manual", views.manual.get);
            this.get("/manual/:page", views.manual.get);
            this.get("/changes", views.changes.get);
            this.get("/account", tryForceHttps(views.account.get));
            this.get("/account/login_or_register", tryForceHttps(views.loginOrRegister.get));
            this.get("/account/lost_password", tryForceHttps(views.lostPassword.get));
            this.get("/account/reset_password/:token", tryForceHttps(views.resetPassword.get));
            this.get("/account/update_card", tryForceHttps(views.accountUpdateCard.get));

            // League views
            this.get("/l/:lid", views.leagueDashboard.get);
            this.get("/l/:lid/new_team", views.newTeam.get);
            this.post("/l/:lid/new_team", views.newTeam.post);
            this.get("/l/:lid/inbox", views.inbox.get);
            this.get("/l/:lid/message", views.message.get);
            this.get("/l/:lid/message/:mid", views.message.get);
            this.get("/l/:lid/standings", views.standings.get);
            this.get("/l/:lid/standings/:season", views.standings.get);
            this.get("/l/:lid/playoffs", views.playoffs.get);
            this.get("/l/:lid/playoffs/:season", views.playoffs.get);
            this.get("/l/:lid/league_finances", views.leagueFinances.get);
            this.get("/l/:lid/league_finances/:season", views.leagueFinances.get);
            this.get("/l/:lid/history", views.history.get);
            this.get("/l/:lid/history/:season", views.history.get);
            this.get("/l/:lid/hall_of_fame", views.hallOfFame.get);
            this.get("/l/:lid/edit_team_info", views.editTeamInfo.get);
            this.post("/l/:lid/edit_team_info", views.editTeamInfo.post);
            this.get("/l/:lid/roster", views.roster.get);
            this.get("/l/:lid/roster/:abbrev", views.roster.get);
            this.get("/l/:lid/roster/:abbrev/:season", views.roster.get);
            this.get("/l/:lid/schedule", views.schedule.get);
            this.get("/l/:lid/schedule/:abbrev", views.schedule.get);
            this.get("/l/:lid/team_finances", views.teamFinances.get);
            this.post("/l/:lid/team_finances", views.teamFinances.post);
            this.get("/l/:lid/team_finances/:abbrev", views.teamFinances.get);
            this.get("/l/:lid/team_finances/:abbrev/:show", views.teamFinances.get);
            this.get("/l/:lid/team_history", views.teamHistory.get);
            this.get("/l/:lid/team_history/:abbrev", views.teamHistory.get);
            this.get("/l/:lid/free_agents", views.freeAgents.get);
            this.get("/l/:lid/trade", views.trade.get);
            this.post("/l/:lid/trade", views.trade.post);
            this.get("/l/:lid/trading_block", views.tradingBlock.get);
            this.post("/l/:lid/trading_block", views.tradingBlock.post);
            this.get("/l/:lid/draft", views.draft.get);
            this.get("/l/:lid/draft_summary", views.draftSummary.get);
            this.get("/l/:lid/draft_summary/:season", views.draftSummary.get);
            this.get("/l/:lid/game_log", views.gameLog.get);
            this.get("/l/:lid/game_log/:abbrev", views.gameLog.get);
            this.get("/l/:lid/game_log/:abbrev/:season", views.gameLog.get);
            this.get("/l/:lid/game_log/:abbrev/:season/:gid", views.gameLog.get);
            this.get("/l/:lid/game_log/:abbrev/:season/:gid/:view", views.gameLog.get);
            this.get("/l/:lid/leaders", views.leaders.get);
            this.get("/l/:lid/leaders/:season", views.leaders.get);
            this.get("/l/:lid/player_ratings", views.playerRatings.get);
            this.get("/l/:lid/player_ratings/:abbrev", views.playerRatings.get);
            this.get("/l/:lid/player_ratings/:abbrev/:season", views.playerRatings.get);
            this.get("/l/:lid/player_stats", views.playerStats.get);
            this.get("/l/:lid/player_stats/:abbrev", views.playerStats.get);
            this.get("/l/:lid/player_stats/:abbrev/:season", views.playerStats.get);
            this.get("/l/:lid/player_stats/:abbrev/:season/:statType", views.playerStats.get);
            this.get("/l/:lid/player_stats/:abbrev/:season/:statType/:playoffs", views.playerStats.get);
            this.get("/l/:lid/team_stats", views.teamStats.get);
            this.get("/l/:lid/team_stats/:season", views.teamStats.get);
            this.get("/l/:lid/player/:pid", views.player.get);
            this.get("/l/:lid/negotiation", views.negotiationList.get);
            this.get("/l/:lid/negotiation/:pid", views.negotiation.get);
            this.post("/l/:lid/negotiation/:pid", views.negotiation.post);
            this.get("/l/:lid/player_rating_dists", views.playerRatingDists.get);
            this.get("/l/:lid/player_rating_dists/:season", views.playerRatingDists.get);
            this.get("/l/:lid/player_stat_dists", views.playerStatDists.get);
            this.get("/l/:lid/player_stat_dists/:season", views.playerStatDists.get);
            this.get("/l/:lid/team_stat_dists", views.teamStatDists.get);
            this.get("/l/:lid/team_stat_dists/:season", views.teamStatDists.get);
            this.get("/l/:lid/player_shot_locations", views.playerShotLocations.get);
            this.get("/l/:lid/player_shot_locations/:season", views.playerShotLocations.get);
            this.get("/l/:lid/team_shot_locations", views.teamShotLocations.get);
            this.get("/l/:lid/team_shot_locations/:season", views.teamShotLocations.get);
            this.get("/l/:lid/export_league", views.exportLeague.get);
            this.post("/l/:lid/export_league", views.exportLeague.post);
            this.get("/l/:lid/fantasy_draft", views.fantasyDraft.get);
            this.post("/l/:lid/fantasy_draft", views.fantasyDraft.post);
            this.get("/l/:lid/live", views.live.get);
            this.get("/l/:lid/live_game", views.liveGame.get);
            this.post("/l/:lid/live_game", views.liveGame.post);
            this.get("/l/:lid/event_log", views.eventLog.get);
            this.get("/l/:lid/event_log/:abbrev", views.eventLog.get);
            this.get("/l/:lid/event_log/:abbrev/:season", views.eventLog.get);
            this.get("/l/:lid/delete_old_data", views.deleteOldData.get);
            this.post("/l/:lid/delete_old_data", views.deleteOldData.post);
            this.get("/l/:lid/draft_scouting", views.draftScouting.get);
            this.get("/l/:lid/draft_scouting/:season", views.draftScouting.get);
            this.get("/l/:lid/watch_list", views.watchList.get);
            this.get("/l/:lid/watch_list/:statType", views.watchList.get);
            this.get("/l/:lid/watch_list/:statType/:playoffs", views.watchList.get);
            this.get("/l/:lid/customize_player", views.customizePlayer.get);
            this.get("/l/:lid/customize_player/:pid", views.customizePlayer.get);
            this.get("/l/:lid/history_all", views.historyAll.get);
            this.get("/l/:lid/upcoming_free_agents", views.upcomingFreeAgents.get);
            this.get("/l/:lid/upcoming_free_agents/:season", views.upcomingFreeAgents.get);
            this.get("/l/:lid/god_mode", views.godMode.get);
            this.get("/l/:lid/power_rankings", views.powerRankings.get);
            this.get("/l/:lid/export_stats", views.exportStats.get);
            this.post("/l/:lid/export_stats", views.exportStats.post);
            this.get("/l/:lid/player_feats", views.playerFeats.get);
            this.get("/l/:lid/player_feats/:abbrev", views.playerFeats.get);
            this.get("/l/:lid/player_feats/:abbrev/:season", views.playerFeats.get);
            this.get("/l/:lid/player_feats/:abbrev/:season/:playoffs", views.playerFeats.get);
            this.get("/l/:lid/multi_team_mode", views.multiTeamMode.get);
            this.get("/l/:lid/team_records", views.teamRecords.get);
            this.get("/l/:lid/team_records/:byType", views.teamRecords.get);
            this.get("/l/:lid/awards_records", views.awardsRecords.get);
            this.get("/l/:lid/awards_records/:awardType", views.awardsRecords.get);
            this.get("/l/:lid/transactions", views.transactions.get);
            this.get("/l/:lid/transactions/:abbrev", views.transactions.get);
            this.get("/l/:lid/transactions/:abbrev/:season", views.transactions.get);
            this.get("/l/:lid/transactions/:abbrev/:season/:eventType", views.transactions.get);
        });

        app.start();

        account.check();

console.log('updating? 5')
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }).catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        }
    });
}());