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

    function get(req) {
        if (req.params.hasOwnProperty("pid")) {
            return {
                pid: parseInt(req.params.pid, 10)
            };
        }

        return {
            pid: null
        };
    }

    function InitViewModel() {
        var i, ratingKeys;

        this.p = {
            face: ko.observable(),
            ratings: ko.observableArray(),
            born: {
                year: ko.observable()
            }
        };
        this.positions = [];

        // Easy access to ratings array, since it could have any number of entries and we only want the last one
        this.ratings = {};
        ratingKeys = ["pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"];
        for (i = 0; i < ratingKeys.length; i++) {
            (function (i) {
                this.ratings[ratingKeys[i]] = ko.computed({
                    read: function () {
                        // Critical: this will always call p.ratings() so it knows to update after player is loaded
                        if (this.p.ratings().length > 0) {
                            return this.p.ratings()[this.p.ratings().length - 1][ratingKeys[i]]();
                        } else {
                            return 0;
                        }
                    },
                    write: function (value) {
                        this.p.ratings()[this.p.ratings().length - 1][ratingKeys[i]](helpers.bound(parseInt(value, 10), 0, 100));
                    },
                    owner: this
                });
            }.bind(this))(i);
        }

        // Set born.year based on age input
        this.age = ko.computed({
            read: function () {
                return g.season - this.p.born.year();
            },
            write: function (value) {
                this.p.born.year(g.season - parseInt(value, 10));
            },
            owner: this
        });
    }

    mapping = {
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
                var i, positions, seasonOffset, vars;

                // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
                if (g.phase < g.PHASE.FREE_AGENCY) {
                    seasonOffset = 0;
                } else {
                    seasonOffset = 1;
                }

                for (i = 0; i < teams.length; i++) {
                    teams[i].text = teams[i].region + " " + teams[i].name;
                }
                teams.unshift({
                    tid: g.PLAYER.UNDRAFTED_3,
                    text: (g.season + seasonOffset + 2) + " Draft Prospect"
                });
                teams.unshift({
                    tid: g.PLAYER.UNDRAFTED_2,
                    text: (g.season + seasonOffset + 1) + " Draft Prospect"
                });
                teams.unshift({
                    tid: g.PLAYER.UNDRAFTED,
                    text: (g.season + seasonOffset) + " Draft Prospect"
                });
                teams.unshift({
                    tid: g.PLAYER.FREE_AGENT,
                    text: "Free Agent"
                });

                positions = ["PG", "SG", "SF", "PF", "C", "G", "GF", "F", "FC"];

                vars = {
                    appearanceOptions: ["Cartoon Face", "Image URL"],
                    faceOptions: {
                        eyes: [0, 1, 2, 3],
                        nose: [0, 1, 2],
                        mouth: [0, 1, 2, 3, 4],
                        hair: [0, 1, 2, 3, 4, 5]
                    },
                    positions: positions,
                    teams: teams
                };

                if (inputs.pid === null) {
                    // Generate new player as basis
                    g.dbl.transaction("teams").objectStore("teams").get(g.userTid).onsuccess = function (event) {
                        var p, scoutingRank, t;

                        t = event.target.result;
                        scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");

                        p = player.generate(g.PLAYER.FREE_AGENT,
                                        20,
                                        null,
                                        50,
                                        50,
                                        g.season,
                                        false,
                                        scoutingRank);

                        p.face.fatness = helpers.round(p.face.fatness, 2);
                        p.face.eyes[0].angle = helpers.round(p.face.eyes[0].angle, 1);
                        p.face.eyes[1].angle = helpers.round(p.face.eyes[1].angle, 1);

                        vars.appearanceOption = "Cartoon Face";
                        p.imgURL = "http://";

                        vars.p = p;
                        deferred.resolve(vars);
                    };
                } else {
                    g.dbl.transaction("players").objectStore("players").get(inputs.pid).onsuccess = function (event) {
                        var p;

                        p = event.target.result;

                        if (p.imgURL.length > 0) {
                            vars.appearanceOption = "Image URL";
                        } else {
                            vars.appearanceOption = "Cartoon Face";
                            p.imgURL = "http://";
                        }

                        vars.p = p;
                        deferred.resolve(vars);
                    };
                }
            });
        }

        return deferred.promise();
    }

    function uiFirst(vm) {
        ui.title("Create A Player");

        document.getElementById("randomize-face").addEventListener("click", function () {
            vm.p.face(komapping.fromJS(generateFace()));
        });

        // Since there are two eyes and the updated observable is the first one, update the second in parallel
        ko.computed(function () {
            vm.p.face().eyes()[1].id(vm.p.face().eyes()[0].id());
        }).extend({throttle: 1});
        ko.computed(function () {
            vm.p.face().eyes()[1].angle(vm.p.face().eyes()[0].angle());
        }).extend({throttle: 1});

        // Update picture display
        ko.computed(function () {
            // This ensures it's not drawn when not visible (like if defaulting to Image URL for a
            // player), and it also ensures that this computed is called when appearanceOption
            // changes. Without this "if", it hows a corrupted display for some reason if Image URL
            // is default and the face is switched to.
            if (vm.appearanceOption() === "Cartoon Face") {
                faces.display("picture", ko.toJS(vm.p.face));
            }
        }).extend({throttle: 1});

        document.getElementById("create-a-player").addEventListener("click", function () {
            var p, pid, r, tx;

            p = komapping.toJS(vm.p);

            // Fix integers that Knockout may have mangled
            p.tid = parseInt(p.tid, 10);
            p.hgt = parseInt(p.hgt, 10);
            p.weight = parseInt(p.weight, 10);
            p.face.fatness = parseFloat(p.face.fatness);
            p.face.eyes[0].angle = parseFloat(p.face.eyes[0].angle);
            p.face.eyes[1].angle = parseFloat(p.face.eyes[1].angle);

            // Fix draft season
            if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
                if (p.tid === g.PLAYER.UNDRAFTED_2) {
                    p.draft.year += 1;
                } else if (p.tid === g.PLAYER.UNDRAFTED_3) {
                    p.draft.year += 2;
                }

                // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
                if (g.phase >= g.PHASE.FREE_AGENCY) {
                    p.draft.year += 1;
                }
            }

            // Set ovr, skills, and bound pot by ovr
            r = p.ratings.length - 1;
            p.ratings[r].ovr = player.ovr(p.ratings[r]);
            p.ratings[r].skills = player.skills(p.ratings[r]);
            if (p.ratings[r].ovr > p.ratings[r].pot) {
                p.ratings[r].pot = p.ratings[r].ovr;
            }

            // Add regular season or playoffs stat row, if necessary
            if (p.tid >= 0) {
                if (g.phase < g.PHASE.PLAYOFFS) {
                    p = player.addStatsRow(p, false);
                } else if (g.phase === g.PHASE.PLAYOFFS) {
                    // This is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
                    p = player.addStatsRow(p, true);
                }
            }

            // Only save image URL if it's selected
            if (vm.appearanceOption() !== "Image URL") {
                p.imgURL = "";
            }

            if (p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3 && g.phase < g.PHASE.FREE_AGENCY) {
                p.draft.year -= 1; // Otherwise he'll show up in this year's draft
            }

            tx = g.dbl.transaction("players", "readwrite");
            // put will either add or update entry
            tx.objectStore("players").put(p).onsuccess = function (event) {
                // Get pid (primary key) after add, but can't redirect to player page until transaction completes or else it's a race condition
                pid = event.target.result;
            };
            tx.oncomplete = function () {
                db.setGameAttributes({lastDbChange: Date.now()}, function () {
                    ui.realtimeUpdate([], helpers.leagueUrl(["player", pid]));
                });
            };
        });
    }

    return bbgmView.init({
        id: "createAPlayer",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateCreateAPlayer],
        uiFirst: uiFirst
    });
});