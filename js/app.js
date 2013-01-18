requirejs(["api", "db", "views", "ui", "util/helpers"], function (api, db, views, ui, helpers) {
    "use strict";

    if (indexedDB === undefined) {
        var data = {
            container: "content",
            template: "browserError",
            title: "Error",
            vars: {}
        };
        ui.update(data);
        return;
    }

    window.api = api;
    window.ui = ui;

    db.connectMeta(function () {
        var app = new Davis(function () {
            this.configure(function () {
                this.generateRequestOnPageLoad = true;
                this.handleRouteNotFound = true;
                this.linkSelector = "a:not([data-no-davis=true])";
            });

            this.bind("routeNotFound", function (req) {
                helpers.error("Page not found.", req);
            });


            // Non-league views
            this.get("/init_db", views.init_db);
            this.get("/", views.dashboard);
            this.get("/new_league", views.newLeague);
            this.post("/new_league", views.newLeague);
            this.post("/delete_league", views.deleteLeague);

            // League views
            this.get("/l/:lid", views.leagueDashboard);
            this.get("/l/:lid/standings", views.standings);
            this.get("/l/:lid/standings/:season", views.standings);
            this.get("/l/:lid/playoffs", views.playoffs);
            this.get("/l/:lid/playoffs/:season", views.playoffs);
            this.get("/l/:lid/finances", views.finances);
            this.get("/l/:lid/history", views.history);
            this.get("/l/:lid/history/:season", views.history);
            this.get("/l/:lid/roster", views.roster);
            this.get("/l/:lid/roster/:abbrev", views.roster);
            this.get("/l/:lid/roster/:abbrev/:season", views.roster);
            this.get("/l/:lid/schedule", views.schedule);
            this.get("/l/:lid/team_history", views.teamHistory);
            this.get("/l/:lid/free_agents", views.freeAgents);
            this.get("/l/:lid/trade", views.trade);
            this.post("/l/:lid/trade", views.trade);
            this.get("/l/:lid/draft", views.draft);
            this.get("/l/:lid/draft/:season", views.draft);
            this.get("/l/:lid/game_log", views.gameLog);
            this.get("/l/:lid/game_log/:abbrev", views.gameLog);
            this.get("/l/:lid/game_log/:abbrev/:season", views.gameLog);
            this.get("/l/:lid/game_log/:abbrev/:season/:gid", views.gameLog);
            this.get("/l/:lid/leaders", views.leaders);
            this.get("/l/:lid/leaders/:season", views.leaders);
            this.get("/l/:lid/player_ratings", views.playerRatings);
            this.get("/l/:lid/player_ratings/:season", views.playerRatings);
            this.get("/l/:lid/player_stats", views.playerStats);
            this.get("/l/:lid/player_stats/:season", views.playerStats);
            this.get("/l/:lid/team_stats", views.teamStats);
            this.get("/l/:lid/team_stats/:season", views.teamStats);
            this.get("/l/:lid/player/:pid", views.player);
            this.get("/l/:lid/negotiation", views.negotiationList);
            this.get("/l/:lid/negotiation/:pid", views.negotiation);
            this.post("/l/:lid/negotiation/:pid", views.negotiation);
            this.get("/l/:lid/dist", views.dist);
            this.get("/l/:lid/dist/:season", views.dist);
        });

        $(document).ready(function () {
            app.start();
        });
    });
});
