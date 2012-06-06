console.log('yo');


var dbm;
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
