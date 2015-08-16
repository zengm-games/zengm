/**
 * @name views.eventLog
 * @namespace Event log.
 */
define(["dao", "globals", "ui", "lib/bluebird", "lib/knockout", "util/bbgmView", "util/helpers", "views/components"], function (dao, g, ui, Promise, ko, bbgmView, helpers, components) {
    "use strict";

    function get(req) {
        var abbrev, out, season, tid;

        if (req.params.abbrev && req.params.abbrev !== "all") {
            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            g.vm.topMenu.template("teamTransaction");
        } else if (req.params.abbrev && req.params.abbrev === "all") {
            tid = -1;
            abbrev = "all";
            g.vm.topMenu.template("leagueTransaction");
        } else {
            tid = g.userTid;
            abbrev = g.teamAbbrevsCache[tid];
            g.vm.topMenu.template("teamTransaction");
        }

        if (req.params.season && req.params.season !== "all") {
            season = helpers.validateSeason(req.params.season);
        } else if (req.params.season && req.params.season === "all") {
            season = "all";
        } else {
            season = g.season;
        }

        return {
            tid: tid,
            abbrev: abbrev,
            season: season,
            eventType: req.params.eventType || 'all'
        };
    }

    function InitViewModel() {
        this.abbrev = ko.observable();
        this.season = ko.observable();
        this.eventType = ko.observable();
        this.events = ko.observableArray([]);
    }

    function updateEventLog(inputs, updateEvents, vm) {
        var filter, maxEid, newEvents;

        if (updateEvents.length >= 0 || inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev() || inputs.eventType !== vm.eventType) {
            if (inputs.season !== vm.season() || inputs.abbrev !== vm.abbrev() || inputs.eventType !== vm.eventType) {
                vm.events([]);
            }

            filter = {}
            if(inputs.season !== "all") {
                filter.index = "season";
                filter.key = inputs.season;
            }
            if (vm.events().length === 0) {
                // Show all events, newest at top
                return dao.events.getAll(filter)
                .then(function (events) {
                    events.reverse(); // Newest first

                    // Filter by team
                    if (inputs.abbrev !== "all") {
                        events = events.filter(function (event) {
                            if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                                return true;
                            }
                        });
                    }

                    if (inputs.eventType === "all") {
                        events = events.filter(function (event) {
                            return event.type === 'reSigned' || event.type === 'released' || event.type === 'trade' || event.type === 'freeAgent' || event.type === 'draft';
                        });
                    } else {
                        events = events.filter(function (event) {
                            return event.type === inputs.eventType;
                        });
                    }

                    events.map(helpers.correctLinkLid);

                    return {
                        abbrev: inputs.abbrev,
                        events: events,
                        season: inputs.season,
                        eventType: inputs.eventType,
                        notAll: inputs.abbrev !== "all",
                    };
                });
            }

            if (inputs.season === g.season) { // Can't update old seasons!
                // Update by adding any new events to the top of the list
                maxEid = ko.unwrap(vm.events()[0].eid); // unwrap shouldn't be necessary
                newEvents = [];
                return dao.events.iterate({
                    index: "season",
                    key: inputs.season,
                    direction: "prev",
                    callback: function (event, shortCircuit) {
                        var i;

                        if (event.eid > maxEid) {
                            if (event.tids !== undefined && event.tids.indexOf(inputs.tid) >= 0) {
                                newEvents.push(event);
                            }
                        } else {
                            shortCircuit();
                            // Oldest first (cursor is in "prev" direction and we're adding to the front of vm.events)
                            for (i = newEvents.length - 1; i >= 0; i--) {
                                vm.events.unshift(newEvents[i]);
                            }
                        }
                    }
                }).then(function () {
                    return {
                        season: inputs.season
                    };
                });
            }
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Transactions - " + vm.season());
        }).extend({
            throttle: 1
        });
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("event-log-dropdown", ["teamsAndAll", "seasonsAndAll", "eventType"], [vm.abbrev(), vm.season(), vm.eventType()], updateEvents);
    }

    return bbgmView.init({
        id: "leagueTransaction",
        get: get,
        InitViewModel: InitViewModel,
        runBefore: [updateEventLog],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});
