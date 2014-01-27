/**
 * @name views.editTeamInfo
 * @namespace Edit Team Info.
 */
define(["db", "globals", "ui", "core/finances", "core/player", "core/team", "lib/faces", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "util/bbgmView", "util/helpers"], function (db, g, ui, finances, player, team, faces, $, ko, komapping, bbgmView, helpers) {
    "use strict";

    var mapping;

    // Same as faces.generate, but round of long decimals
    function generateFace() {
        var face;

        face = faces.generate();
        face.fatness = helpers.round(face.fatness, 2);
        face.eyes[0].angle = helpers.round(face.eyes[0].angle, 1);
        face.eyes[1].angle = helpers.round(face.eyes[1].angle, 1);

        return face;
    }

    function post(req) {
        var button;

        button = document.getElementById("create-a-player");
        button.disabled = true;

        g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
            var draftYear, p, pid, scoutingRank, seasonOffset, t, tid, tx;

            t = event.target.result;
            scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");

            tid = parseInt(req.params.tid, 10);

            draftYear = g.season;

            if (tid === g.PLAYER.UNDRAFTED || tid === g.PLAYER.UNDRAFTED_2 || tid === g.PLAYER.UNDRAFTED_3) {
                if (tid === g.PLAYER.UNDRAFTED_2) {
                    draftYear += 1;
                } else if (tid === g.PLAYER.UNDRAFTED_3) {
                    draftYear += 2;
                }

                // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
                if (g.phase < g.PHASE.FREE_AGENCY) {
                    seasonOffset = 0;
                } else {
                    seasonOffset = 1;
                }
                draftYear += seasonOffset;
            }

            p = player.generate(tid,
                            helpers.bound(parseInt(req.params.age, 10), 0, 100),
                            null,
                            50,
                            parseInt(req.params["rating-pot"], 10),
                            draftYear,
                            false,
                            scoutingRank);

            p.ratings[0].hgt = helpers.bound(parseInt(req.params["rating-hgt"], 10), 0, 100);
            p.ratings[0].stre = helpers.bound(parseInt(req.params["rating-stre"], 10), 0, 100);
            p.ratings[0].spd = helpers.bound(parseInt(req.params["rating-spd"], 10), 0, 100);
            p.ratings[0].jmp = helpers.bound(parseInt(req.params["rating-jmp"], 10), 0, 100);
            p.ratings[0].endu = helpers.bound(parseInt(req.params["rating-endu"], 10), 0, 100);
            p.ratings[0].ins = helpers.bound(parseInt(req.params["rating-ins"], 10), 0, 100);
            p.ratings[0].dnk = helpers.bound(parseInt(req.params["rating-dnk"], 10), 0, 100);
            p.ratings[0].ft = helpers.bound(parseInt(req.params["rating-ft"], 10), 0, 100);
            p.ratings[0].fg = helpers.bound(parseInt(req.params["rating-fg"], 10), 0, 100);
            p.ratings[0].tp = helpers.bound(parseInt(req.params["rating-tp"], 10), 0, 100);
            p.ratings[0].blk = helpers.bound(parseInt(req.params["rating-blk"], 10), 0, 100);
            p.ratings[0].stl = helpers.bound(parseInt(req.params["rating-stl"], 10), 0, 100);
            p.ratings[0].drb = helpers.bound(parseInt(req.params["rating-drb"], 10), 0, 100);
            p.ratings[0].pss = helpers.bound(parseInt(req.params["rating-pss"], 10), 0, 100);
            p.ratings[0].reb = helpers.bound(parseInt(req.params["rating-reb"], 10), 0, 100);
            p.ratings[0].ovr = player.ovr(p.ratings[0]);
            p.ratings[0].skills = player.skills(p.ratings[0]);
            if (p.ratings[0].ovr > p.ratings[0].pot) {
                p.ratings[0].pot = p.ratings[0].ovr;
            }

            p.born.loc = req.params["born-loc"];
            p.hgt = parseInt(req.params.hgt, 10);
            p.name = req.params.name;
            p.pos = req.params.pos;
            p.watch = true;
            p.weight = parseInt(req.params.weight, 10);

            p.face.color = req.params["face-color"];
            p.face.fatness = parseFloat(req.params["face-fatness"]);
            p.face.eyes[0].id = parseInt(req.params["face-eyes"], 10);
            p.face.eyes[1].id = parseInt(req.params["face-eyes"], 10);
            p.face.eyes[0].angle = parseFloat(req.params["face-eyes"]);
            p.face.eyes[1].angle = parseFloat(req.params["face-eyes"]);
            p.face.hair.id = parseInt(req.params["face-hair"], 10);
            p.face.mouth.id = parseInt(req.params["face-mouth"], 10);
            p.face.nose.id = parseInt(req.params["face-nose"], 10);
            p.face.nose.flip = req.params["face-nose-flip"] === "on";

            if (req.params["appearance-option"] === "Image URL") {
                p.imgURL = req.params["image-url"];
            }

            if (tid !== g.PLAYER.UNDRAFTED && tid !== g.PLAYER.UNDRAFTED_2 && tid !== g.PLAYER.UNDRAFTED_3 && g.phase < g.PHASE.FREE_AGENCY) {
                p.draft.year -= 1; // Otherwise he'll show up in this year's draft
            }

            tx = g.dbl.transaction("players", "readwrite");
            tx.objectStore("players").add(p).onsuccess = function (event) {
                // Get pid (primary key) after add, but can't redirect to player page until transaction completes or else it's a race condition
                pid = event.target.result;
            };
            tx.oncomplete = function () {
                db.setGameAttributes({lastDbChange: Date.now()}, function () {
                    ui.realtimeUpdate([], helpers.leagueUrl(["player", pid]));
                });
            };
        };
    }

    function InitViewModel() {
        this.face = ko.observable();
    }

    mapping = {
        positions: {
            create: function (options) {
                return options.data;
            }
        },
        teams: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateCreateAPlayer(inputs, updateEvents) {
        var deferred;
        deferred = $.Deferred();

        if (updateEvents.indexOf("firstRun") >= 0) {
            team.filter({
                attrs: ["tid", "region", "name"],
                season: g.season
            }, function (teams) {
                var face, positions, seasonOffset;

                // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
                if (g.phase < g.PHASE.FREE_AGENCY) {
                    seasonOffset = 0;
                } else {
                    seasonOffset = 1;
                }

                teams.unshift({
                    tid: g.PLAYER.UNDRAFTED_3,
                    region: "",
                    name: (g.season + seasonOffset + 2) + " Draft Prospect"
                });
                teams.unshift({
                    tid: g.PLAYER.UNDRAFTED_2,
                    region: "",
                    name: (g.season + seasonOffset + 1) + " Draft Prospect"
                });
                teams.unshift({
                    tid: g.PLAYER.UNDRAFTED,
                    region: "",
                    name: (g.season + seasonOffset) + " Draft Prospect"
                });
                teams.unshift({
                    tid: g.PLAYER.FREE_AGENT,
                    region: "",
                    name: "Free Agent"
                });

                positions = [{pos: "PG"}, {pos: "SG"}, {pos: "SF"}, {pos: "PF"}, {pos: "C"}, {pos: "G"}, {pos: "GF"}, {pos: "FC"}];

                face = generateFace();

                deferred.resolve({
                    appearanceOption: "",
                    appearanceOptions: ["Cartoon Face", "Image URL"],
                    face: face,
                    faceOptions: {
                        eyes: [0, 1, 2, 3],
                        nose: [0, 1, 2],
                        mouth: [0, 1, 2, 3, 4],
                        hair: [0, 1, 2, 3, 4, 5]
                    },
                    name: player.name(),
                    positions: positions,
                    teams: teams
                });
            });
        }

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Create A Player");

        //faces.display("picture", ko.toJS(vm.face()));

        document.getElementById("randomize-face").addEventListener("click", function (event) {
            event.preventDefault();
            vm.face(komapping.fromJS(generateFace()));
        });

        ko.computed(function () {
            vm.face().eyes()[1].id(vm.face().eyes()[0].id());
        }).extend({throttle: 1});
        ko.computed(function () {
            vm.face().eyes()[1].angle(vm.face().eyes()[0].angle());
        }).extend({throttle: 1});

        ko.computed(function () {
            faces.display("picture", ko.toJS(vm.face()));
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "createAPlayer",
        post: post,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateCreateAPlayer],
        uiFirst: uiFirst
    });
});