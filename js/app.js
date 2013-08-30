requirejs.config({
    baseUrl: "/js",
    shim: {
        "lib/bootstrap-alert": {
            deps: ["lib/jquery"]
        },
        "lib/bootstrap-dropdown": {
            deps: ["lib/jquery"]
        },
        "lib/bootstrap-popover": {
            deps: ["lib/bootstrap-tooltip", "lib/jquery"]
        },
        "lib/bootstrap-tooltip": {
            deps: ["lib/jquery"]
        },
        "lib/bootstrapx-clickover": {
            deps: ["lib/bootstrap-popover", "lib/bootstrap-tooltip", "lib/jquery"]
        },
        "lib/boxPlot": {
            exports: "boxPlot"
        },
        "lib/davis": {
            deps: ["lib/jquery"],
            exports: "Davis"
        },
        "lib/davis.google_analytics": {
            deps: ["lib/davis"]
        },
        "lib/faces": {
            deps: ["lib/raphael"],
            exports: "faces"
        },
        "lib/html5-dataset": {},
        "lib/IndexedDB-getAll-shim": {},
        "lib/jquery-ui": {
            deps: ["lib/jquery"]
        },
        "lib/jquery": {
            exports: "$"
        },
        "lib/jquery.barGraph": {
            deps: ["lib/bootstrap-tooltip", "lib/jquery"]
        },
        "lib/jquery.dataTables": {
            deps: ["lib/jquery"]
        },
        "lib/jquery.dataTables.bbgmSorting": {
            deps: ["lib/jquery", "lib/jquery.dataTables"]
        },
        "lib/jquery.dataTables.bootstrap": {
            deps: ["lib/jquery", "lib/jquery.dataTables"]
        },
        "lib/jquery.tabSlideOut": {
            deps: ["lib/jquery"]
        },
        "lib/raphael": {
            exports: "Raphael"
        },
        "lib/underscore": {
            exports: "_"
        }
    }
});

requirejs(["db", "views", "ui", "lib/davis", "util/helpers", "lib/bootstrap-alert", "lib/bootstrap-dropdown", "lib/bootstrap-popover", "lib/bootstrapx-clickover", "lib/davis.google_analytics", "lib/html5-dataset", "lib/IndexedDB-getAll-shim", "lib/jquery-ui", "lib/jquery.barGraph", "lib/jquery.dataTables", "lib/jquery.dataTables.bbgmSorting", "lib/jquery.dataTables.bootstrap", "lib/jquery.tabSlideOut", "util/templateHelpers", "api"], function (db, views, ui, Davis, helpers) {
    "use strict";

    ui.init();

    // Can't proceed any further without IndexedDB support
    if (typeof indexedDB === "undefined") { // Some browsers don't like just plain "indexedDB === undefined"
        helpers.error('<p>Your browser is not modern enough to run Basketball GM.</p><p>Currently, <a href="http://www.firefox.com/">Mozilla Firefox</a> and <a href="http://www.google.com/chrome/">Google Chrome</a> work best with Basketball GM.</p>');
        return;
    }

    db.connectMeta(function () {
        var app = new Davis(function () {
            this.configure(function () {
                this.generateRequestOnPageLoad = true;
                this.handleRouteNotFound = true;
                this.linkSelector = "a:not([data-no-davis=true])";
            });

            this.use(Davis.googleAnalytics);

            this.bind("routeNotFound", function (req) {
                helpers.error("Page not found.", req.raw.cb);
            });

            // Non-league views
            this.get("/", views.dashboard.get);
            this.get("/new_league", views.newLeague.get);
            this.post("/new_league", views.newLeague.post);
            this.get("/delete_league/:lid", views.deleteLeague.get);
            this.post("/delete_league", views.deleteLeague.post);
            this.get("/manual", views.manual.get);
            this.get("/manual/:page", views.manual.get);

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
            this.get("/l/:lid/team_finances", views.teamFinances.get);
            this.post("/l/:lid/team_finances", views.teamFinances.post);
            this.get("/l/:lid/team_finances/:abbrev", views.teamFinances.get);
            this.get("/l/:lid/team_finances/:abbrev/:show", views.teamFinances.get);
            this.get("/l/:lid/team_history", views.teamHistory.get);
            this.get("/l/:lid/team_history/:abbrev", views.teamHistory.get);
            this.get("/l/:lid/free_agents", views.freeAgents.get);
            this.get("/l/:lid/trade", views.trade.get);
            this.post("/l/:lid/trade", views.trade.post);
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
            this.get("/l/:lid/player_ratings/:season", views.playerRatings.get);
            this.get("/l/:lid/player_stats", views.playerStats.get);
            this.get("/l/:lid/player_stats/:season", views.playerStats.get);
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
            this.get("/l/:lid/export_rosters", views.exportRosters.get);
            this.post("/l/:lid/export_rosters", views.exportRosters.post);
        });

        app.start();
    });
});
