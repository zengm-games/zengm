var views = {
    init_db: function () {
        var data = {'title': 'Initialize Database'};
        var url = '/init_db';

        data['content'] = 'Resetting databases...'

        // Delete any current meta databases
        db_meta.close();
        indexedDB.deleteDatabase("meta");

        // Create new meta database
        request = db.connect_meta();
        request.onsuccess = function(event) {
            db_meta = request.result;
            db_meta.onerror = function(event) {
                console.log("Meta database error: " + event.target.errorCode);
            };
        };
//        var transaction = db_meta.transaction(["customers"], IDBTransaction.READ_WRITE);

        ajax_update(data, url);
    },

    dashboard: function () {
        var data = {'title': 'Dashboard'};
        var url = '/';

        var leagues = [];
        var leaguesStore = db_meta.transaction("leagues").objectStore("leagues");
        leaguesStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                leagues.push(cursor.value);
                cursor.continue();
            }
            else {
                template = Handlebars.templates['dashboard'];
                context = {'leagues': leagues};
                data['content'] = template(context);

                ajax_update(data, url);
            }
        };
    },

    new_league: function (req) {
        var data = {'title': 'Create New League'};
        var url = '/new_league';

        if (req.method === "get") {
            var teams = [];
            var teamsStore = db_meta.transaction(["teams"]).objectStore("teams");
            teamsStore.openCursor().onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    teams.push(cursor.value);
                    cursor.continue();
                }
                else {
                    template = Handlebars.templates['new_league'];
                    context = {'teams': teams};
                    data['content'] = template(context);

                    ajax_update(data, url);
                }
            };
        }
        else if (req.method === "post") {
            tid = parseInt(req.params['tid'], 10);
console.log('New tid: ' + tid);
            if (tid >= 0 && tid <= 29) {
                league.new(tid);
            }
        }
    },

    delete_league: function (req) {
        lid = parseInt(req.params['lid'], 10);
        league.delete(lid)
        req.redirect('/');
    }
};
