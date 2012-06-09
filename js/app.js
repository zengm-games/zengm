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
        this.before('/l/:lid', function (req) {
            // Make sure league exists

            // Connect to league database

            // Make sure league template is showing

            console.log('League URL detected!');
        })
        this.get('/l/:lid', function (req) {
            $('body').append('<h1>Hello there, ' + req.params['lid'] + '!</h1>');
        });
    });

    $(document).ready(function() {
        app.start();
    });
};

console.log('yo');
