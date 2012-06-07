var conferences = [{cid: 0, name: "Eastern Conference"}, {cid: 1, name: "Western Conference"}];
var divisions = [{did: 0, cid: 0, name: "Atlantic"}, {did: 1, cid: 0, name: "Central"}, {did: 2, cid: 0, name: "Southeast"}, {did: 3, cid: 1, name: "Southwest"}, {did: 4, cid: 1, name: "Northwest"}, {did: 5, cid: 1, name: "Pacific"}];
startingSeason = 2012;

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
        this.get('/l/:lid', function (req) {
            $('body').append('<h1>Hello there, ' + req.params['lid'] + '!</h1>');
        });
        this.get('/init_db', views.init_db);
        this.get('/', views.dashboard);
        this.get('/new_league', views.new_league);
        this.post('/new_league', views.new_league);
        this.post('/delete_league', views.delete_league);
    });

    $(document).ready(function() {
        app.start();

        // Load appropriate view based on location bar
        Davis.location.assign(new Davis.Request(window.location.pathname));
    });
};

console.log('yo');
