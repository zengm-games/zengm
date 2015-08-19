/**
 * @name views.components
 * @namespace Small components/widgets, such as drop down menus to switch between seasons/teams.
 */
define(["globals", "ui", "lib/jquery", "lib/knockout", "util/helpers"], function (g, ui, $, ko, helpers) {
    "use strict";

    var vm;

    vm = {
        formId: ko.observable(),
        fields: ko.observable([])
    };

    /**
     * Creates or updates a dropdown form.
     *
     * This should be called every time the page with the dropdown is loaded/updated so the dropdown can be appropriately managed.
     *
     * @memberOf  views.components
     * @param {string} formId DOM ID of the form element to fill. If this is the same as the value the previous time this was called, then an update will occur.
     * @param {Array.<string>} fields Array of strings of the type of fields to allow (current acceptable values are "teams", "seasons", "shows", and "statTypes"). Each element represents a dropdown and a component of the URL - so if "teams" and "seasons" is passed, URLs will be generated like /l/1/.../ATL/2014.
     * @param {Array} selected Array of values corresponding to the default "selected" value of each field, like "CHI" or 2022 for "teams" or "seasons".
     * @param {Array.<string>} updateEvents Update events describing what has changed in this reload.
     * @param {?string=} extraParam Any extra parameter to append to the URL, like /l/1/.../ATL/2014/extraParam. Default is to append nothing.
     */
    function dropdown(formId, fields, selected, updateEvents, extraParam) {
        var fieldId, formEl, i, j, offset, options;

        formEl = document.getElementById(formId);

        // If formEl can't be found, user quickly clicked away from page
        if (formEl === null) {
            return;
        }

        if (formEl.dataset.idLoaded !== formId) {
            // Build initial values
            vm.formId(formId);
            vm.fields([]);
            for (i = 0; i < fields.length; i++) {
                fieldId = formId + "-" + fields[i];
                if (fields[i] === "teams") {
                    options = [];
                    for (j = 0; j < g.numTeams; j++) {
                        options[j] = {};
                        options[j].key = g.teamAbbrevsCache[j];
                        options[j].val = g.teamRegionsCache[j] + " " + g.teamNamesCache[j];
                    }
                } else if (fields[i] === "teamsAndAll") {
                    options = [{
                        key: "all",
                        val: "All Teams"
                    }];
                    for (j = 0; j < g.numTeams; j++) {
                        options[j + 1] = {};
                        options[j + 1].key = g.teamAbbrevsCache[j];
                        options[j + 1].val = g.teamRegionsCache[j] + " " + g.teamNamesCache[j];
                    }
                } else if (fields[i] === "teamsAndAllWatch") {
                    options = [{
                        key: "all",
                        val: "All Teams"
                    }, {
                        key: "watch",
                        val: "Watch List"
                    }];
                    for (j = 0; j < g.numTeams; j++) {
                        options[j + 2] = {};
                        options[j + 2].key = g.teamAbbrevsCache[j];
                        options[j + 2].val = g.teamRegionsCache[j] + " " + g.teamNamesCache[j];
                    }
                } else if (fields[i] === "seasons" || fields[i] === "seasonsAndCareer" || fields[i] === "seasonsAndAll") {
                    options = helpers.getSeasons();
                    for (j = 0; j < options.length; j++) {
                        options[j].key = options[j].season;
                        options[j].val = options[j].season + " Season";
                    }
                    if (fields[i] === "seasonsAndCareer") {
                        options.unshift({
                            key: "career",
                            val: "Career Totals"
                        });
                    }
                    if (fields[i] === "seasonsAndAll") {
                        options.unshift({
                            key: "all",
                            val: "All Seasons"
                        });
                    }
                } else if (fields[i] === "seasonsUpcoming") {
                    options = [];
                    // For upcomingFreeAgents, bump up 1 if we're past the season
                    offset = g.phase <= g.PHASE.RESIGN_PLAYERS ? 0 : 1;
                    for (j = 0 + offset; j < 5 + offset; j++) {
                        options.push({
                            key: g.season + j,
                            val: (g.season + j) + " season"
                        });
                    }
                } else if (fields[i] === "playoffs") {
                    options = [{
                        val: "Regular Season",
                        key: "regular_season"
                    }, {
                        val: "Playoffs",
                        key: "playoffs"
                    }];
                } else if (fields[i] === "shows") {
                    options = [{
                        val: "Past 10 Seasons",
                        key: "10"
                    }, {
                        val: "All Seasons",
                        key: "all"
                    }];
                } else if (fields[i] === "statTypes") {
                    options = [{
                        val: "Per Game",
                        key: "per_game"
                    }, {
                        val: "Per 36 Mins",
                        key: "per_36"
                    }, {
                        val: "Totals",
                        key: "totals"
                    }];
                } else if (fields[i] === "awardType") {
                    options = [{
                            val: "Won Championship",
                            key: "champion"
                        }, {
                            val: "Most Valuable Player",
                            key: "mvp"
                        }, {
                            val: "Finals MVP",
                            key: "finals_mvp"
                        }, {
                            val: "Defensive Player of the Year",
                            key: "dpoy"
                        }, {
                            val: "Sixth Man of the Year",
                            key: "smoy"
                        }, {
                            val: "Rookie of the Year",
                            key: "roy"
                        }, {
                            val: "First Team All-League",
                            key: "first_team"
                        }, {
                            val: "Second Team All-League",
                            key: "second_team"
                        }, {
                            val: "Third Team All-League",
                            key: "third_team"
                        }, {
                            val: "All-League",
                            key: "all_league"
                        }, {
                            val: "First Team All-Defensive",
                            key: "first_def"
                        }, {
                            val: "Second Team All-Defensive",
                            key: "second_def"
                        }, {
                            val: "Third Team All-Defensive",
                            key: "third_def"
                        }, {
                            val: "All-Defensive",
                            key: "all_def"
                        }

                    ];
                } else if (fields[i] === "eventType") {
                    options = [{
                        val: "All Types",
                        key: "all"
                    }, {
                        val: "Draft",
                        key: "draft"
                    }, {
                        val: "FA Signed",
                        key: "freeAgent"
                    }, {
                        val: "Resigned",
                        key: "reSigned"
                    }, {
                        val: "Released",
                        key: "released"
                    }, {
                        val: "Trades",
                        key: "trade"
                    }];
                } else if (fields[i] === "teamRecordType") {
                    options = [{
                        val: "By Team",
                        key: "team"
                    }, {
                        val: "By Conference",
                        key: "conf"
                    }, {
                        val: "By Division",
                        key: "div"
                    }];
                }
                vm.fields().push({
                    id: fieldId,
                    name: fields[i],
                    options: ko.observableArray(options),
                    selected: ko.observable(selected[i])
                });
            }

            formEl.dataset.idLoaded = formId;

            // Only apply binding the first time (this is mainly for unit testing)
            ko.applyBindings(vm, formEl);

            if (fields.length === 1) {
                ui.dropdown($("#" + formId + "-" + fields[0]));
            } else if (fields.length === 2) {
                ui.dropdown($("#" + formId + "-" + fields[0]), $("#" + formId + "-" + fields[1]));
            } else if (fields.length === 3) {
                ui.dropdown($("#" + formId + "-" + fields[0]), $("#" + formId + "-" + fields[1]), $("#" + formId + "-" + fields[2]));
            } else if (fields.length === 4) {
                ui.dropdown($("#" + formId + "-" + fields[0]), $("#" + formId + "-" + fields[1]), $("#" + formId + "-" + fields[2]), $("#" + formId + "-" + fields[3]));
            }
        }

        // See if default value changed
        for (i = 0; i < fields.length; i++) {
            if (selected[i] !== vm.fields()[i].selected()) {
                vm.fields()[i].selected(selected[i]);
            }
        }

        // Check if extraParam is set correctly
        if (extraParam === undefined || extraParam === null) {
            formEl.dataset.extraParam = "";
        } else if (formEl.dataset.extraParam !== extraParam) {
            formEl.dataset.extraParam = extraParam;
        }

        // Check if any field needs to be updated
        for (i = 0; i < vm.fields().length; i++) {
            if (vm.fields()[i].name === "seasons" || fields[i] === "seasonsAndCareer") {
                if (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) {
                    vm.fields()[i].options.push({
                        val: g.season + " season",
                        key: g.season
                    });
                }
            }
        }
    }

    return {
        dropdown: dropdown
    };
});
