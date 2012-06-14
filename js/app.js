requirejs.config({
    baseUrl: 'js'
});


requirejs(['g', 'db', 'views'],
function (g, db, views) {
console.log(g);
    g.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    request = db.connect_meta();
    request.onsuccess = function(event) {
        g.dbm = request.result;
        g.dbm.onerror = function(event) {
            console.log("Meta database error: " + event.target.errorCode);
        };

        var app = Davis(function () {
            this.configure(function () {
                this.generateRequestOnPageLoad = true;
            });

            // Non-league views
            this.get('/init_db', views.init_db);
            this.get('/', views.dashboard);
            this.get('/new_league', views.new_league);
            this.post('/new_league', views.new_league);
            this.post('/delete_league', views.delete_league);

            // League views
            this.get('/l/:lid', views.league_dashboard);
            this.get('/l/:lid/game_log', views.game_log);
            this.get('/l/:lid/game_log/:viewSeason', views.game_log);
            this.get('/l/:lid/game_log/:viewSeason/:viewAbbrev', views.game_log);
        });

        $(document).ready(function() {
            app.start();
        });
    };

    console.log('yo');
});
