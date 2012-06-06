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

        template = Handlebars.templates['dashboard'];
        context = {'leagues': leagues};
        data['content'] = template(context);

        ajax_update(data, url);
    },

    new_league: function(req) {
        var data = {'title': 'Create New League'};
        var url = '/new_league';

        if (req.method === "get") {
            template = Handlebars.templates['new_league'];
            context = {'teams': teams};
            data['content'] = template(context);

            ajax_update(data, url);
        }
        else if (req.method === "post") {
            tid = parseInt(req.params['tid'], 10);
console.log(tid);
            if (tid >= 0 && tid <= 29) {
//                lid = league.new(tid);
                req.redirect('/');
            }
        }
    }
};
