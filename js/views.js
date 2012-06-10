var views = {
    "init_db": function () {
        var data = {"title": "Initialize Database"};
        var url = "/init_db";

        data["content"] = "Resetting databases..."

        // Delete any current league databases
        console.log("Delete any current league databases...");
        if (dbl !== undefined) {
            dbl.close();
        }
        db.getAll(dbm, "leagues", function (leagues) {
            for (var i=0; i<leagues.length; i++) {
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

    "dashboard": function () {
        var data = {"title": "Dashboard"};
        var url = "/";

        db.getAll(dbm, "leagues", function (leagues) {
            template = Handlebars.templates['dashboard'];
            data["content"] = template({"leagues": leagues});

            ajax_update(data, url);
        });
    },

    "new_league": function (req) {
        var data = {"title": "Create New League"};
        var url = "/new_league";

        if (req.method === "get") {
            db.getAll(dbm, "teams", function (teams) {
                template = Handlebars.templates['new_league'];
                data["content"] = template({"teams": teams});

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

    "delete_league": function (req) {
        lid = parseInt(req.params['lid'], 10);
        league.delete(lid)
        req.redirect('/');
    },

    "league_dashboard": function (req) {
        var data = {"title": "Dashboard - League " + g.lid};
        var url = "/l/" + g.lid;

        template = Handlebars.templates['league_dashboard'];
        data["league_content"] = template({"g": g});

        ajax_update(data, url);
    }


};
