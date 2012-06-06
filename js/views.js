var views = {
    init_db: function() {
        var data = {'title': 'Initialize Database'};
        var url = '/init_db';

        data['content'] = 'Resetting databases...'

        // Delete any current bbgm databases
        db_bbgm.close();
        indexedDB.deleteDatabase("bbgm");

        // Create new bbgm database

        // Create new tables in bbgm
//        var transaction = db_bbgm.transaction(["customers"], IDBTransaction.READ_WRITE);

        ajax_update(data, url);
    },

    dashboard: function() {
        var data = {'title': 'Dashboard'};
        var url = '/';

        var leagues = [];
        var leaguesStore = db_bbgm.transaction("leagues").objectStore("leagues");
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

    new_league: function() {
        var data = {'title': 'Create New League'};
        var url = '/new_league';

        var teams = [];
        var teamsStore = db_bbgm.transaction("teams").objectStore("teams");
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
};
