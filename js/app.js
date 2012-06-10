var g = {};
g.startingSeason = 2012;
g.conferences = [{cid: 0, name: "Eastern Conference"}, {cid: 1, name: "Western Conference"}];
g.divisions = [{did: 0, cid: 0, name: "Atlantic"}, {did: 1, cid: 0, name: "Central"}, {did: 2, cid: 0, name: "Southeast"}, {did: 3, cid: 1, name: "Southwest"}, {did: 4, cid: 1, name: "Northwest"}, {did: 5, cid: 1, name: "Pacific"}];

var dbm; // Meta database
var dbl; // League-specific database
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
request = db.connect_meta();
request.onsuccess = function(event) {
    dbm = request.result;
    dbm.onerror = function(event) {
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
        this.before('/l/*lid', function (req) {
            g.lid = parseInt(req.params.lid.split('/')[0], 10);

            // Make sure league exists

            // Connect to league database

            // Make sure league template FOR THE CURRENT LEAGUE is showing
            var $leagueMenu = $('#league_menu');
            if ($leagueMenu.length === 0 || $leagueMenu.data('lid') != g.lid) {
                data = {};
                template = Handlebars.templates['league_layout'];
                data["content"] = template({"g": g});
                ajax_update(data);
            }
        })
        this.get('/l/:lid', views.league_dashboard);
    });

    $(document).ready(function() {
        app.start();
    });
};

console.log('yo');
