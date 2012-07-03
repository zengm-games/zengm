requirejs(["db", "views", "bbgm", "api"], function (db, views, bbgm, api) {
    "use strict";

    window.api = api;
    window.bbgm = bbgm;

    g.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var request = db.connect_meta();
    request.onsuccess = function (event) {
        g.dbm = request.result;
        g.dbm.onerror = function (event) {
            console.log("Meta database error: " + event.target.errorCode);
        };

        var app = Davis(function () {
            this.configure(function () {
                this.generateRequestOnPageLoad = true;
                this.linkSelector = 'a:not([href="#"])';
            });

            // Non-league views
            this.get('/init_db', views.init_db);
            this.get('/', views.dashboard);
            this.get('/new_league', views.new_league);
            this.post('/new_league', views.new_league);
            this.post('/delete_league', views.delete_league);

            // League views
            this.get('/l/:lid', views.league_dashboard);
            this.get('/l/:lid/standings', views.standings);
            this.get('/l/:lid/standings/:season', views.standings);
            this.get('/l/:lid/playoffs', views.playoffs);
            this.get('/l/:lid/playoffs/:season', views.playoffs);
            this.get('/l/:lid/roster', views.roster);
            this.get('/l/:lid/roster/:abbrev', views.roster);
            this.get('/l/:lid/roster/:abbrev/:season', views.roster);
            this.get('/l/:lid/schedule', views.schedule);
            this.get('/l/:lid/game_log', views.game_log);
            this.get('/l/:lid/game_log/:abbrev', views.game_log);
            this.get('/l/:lid/game_log/:abbrev/:season', views.game_log);
            this.get('/l/:lid/free_agents', views.free_agents);
            this.get('/l/:lid/draft', views.draft);
            this.get('/l/:lid/draft/:season', views.draft);
            this.get('/l/:lid/negotiation', views.negotiationList);
            this.get('/l/:lid/negotiation/:pid', views.negotiation);
            this.post('/l/:lid/negotiation/:pid', views.negotiation);
        });

        $(document).ready(function () {
            app.start();
        });
    };
});
