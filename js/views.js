var views = {
    init_db: function () {
        var data = {"title": "Initialize Database"};
        var url = "/init_db";

        data["content"] = "Resetting databases..."

        // Delete any current league databases
        console.log("Delete any current league databases...");
        if (dbl !== undefined) {
            dbl.close();
        }
        db.getAll(dbm, "leagues", function (leagues) {
            for (i in leagues) {
                indexedDB.deleteDatabase("league" + leagues[i]["lid"]);
            }
        });

        // Delete any current meta database
        console.log("Delete any current meta database...");
        dbm.close();
        indexedDB.deleteDatabase("meta");

        // Create new meta database
        console.log("Create new meta database...");
        request = db.connect_meta();
        request.onsuccess = function(event) {
            dbm = request.result;
            dbm.onerror = function(event) {
                console.log("Meta database error: " + event.target.errorCode);
            };
        };

        console.log("Done!");

        ajax_update(data, url);
    },

    dashboard: function () {
        var data = {"title": "Dashboard"};
        var url = "/";

        db.getAll(dbm, "leagues", function (leagues) {
            template = Handlebars.templates['dashboard'];
            context = {"leagues": leagues};
            data["content"] = template(context);

            ajax_update(data, url);
        });
    },

    new_league: function (req) {
        var data = {"title": "Create New League"};
        var url = "/new_league";

        if (req.method === "get") {
            db.getAll(dbm, "teams", function (teams) {
                template = Handlebars.templates['new_league'];
                context = {"teams": teams};
                data["content"] = template(context);

                ajax_update(data, url);
            });
        }
        else if (req.method === "post") {
            tid = parseInt(req.params["tid"], 10);
console.log("New tid: " + tid);
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
