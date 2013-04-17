/**
 * @name util.bbgmView
 * @namespace Framework for loading, displaying, and updating content. bbgmView is designed so that it is easy to write UIs that are granular in both reading from the database and updating the DOM, to minimize useless updates to previously cached or displayed values.
 */
define(["globals", "ui", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/viewHelpers"], function (g, ui, $, ko, komapping, _, viewHelpers) {
    "use strict";

    var vm;

    function display(args, updateEvents) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.idLoaded !== args.id) {
console.log('draw from scratch')
            ui.update({
                container: "league_content",
                template: args.id
            });
            ko.applyBindings(vm, leagueContentEl);
            if (args.uiFirst !== undefined) {
                args.uiFirst(vm);
            }
        }
        if (args.uiEvery !== undefined) {
            args.uiEvery(updateEvents, vm);
        }
    }

    function update(args) {
        return function (inputs, updateEvents, cb) {
            var leagueContentEl;

            // Reset league content and view model only if it's:
            // (1) if it's not loaded and not loading yet
            // (2) loaded, but loading something else
            leagueContentEl = document.getElementById("league_content");
            if ((leagueContentEl.dataset.idLoaded !== args.id && leagueContentEl.dataset.idLoading !== args.id) || (leagueContentEl.dataset.idLoaded === args.id && leagueContentEl.dataset.idLoading !== args.id && leagueContentEl.dataset.idLoading !== "")) {
                ko.cleanNode(leagueContentEl);

                leagueContentEl.dataset.idLoading = args.id;

                inputs.firstRun = true;

                // View model
                vm = new args.InitViewModel(inputs);
            }

            $.when.apply(null, _.map(args.runBefore, function (fn) {
                return fn(inputs, updateEvents, vm);
            })).done(function () {
                var afterEverything, i, vars;

                if (arguments.length > 1) {
                    vars = $.extend.apply(null, arguments);
                } else {
                    vars = arguments[0];
                }

                komapping.fromJS(vars, args.mapping, vm);
//console.log(vars);
//console.log(vm);

                display(args, updateEvents);

                // This will be called after every runWhenever function is finished.
                afterEverything = _.after(args.runWhenever.length, function () {
                    leagueContentEl.dataset.idLoading = ""; // Done loading
                    cb();
                });

                for (i = 0; i < args.runWhenever.length; i++) {
                    $.when(args.runWhenever[i](inputs, updateEvents, vm)).done(function (vars) {
                        if (vars !== undefined) {
                            komapping.fromJS(vars, args.mapping, vm);
                        }

                        afterEverything();
                    });
                }
            });
        };
    }

    function get(fnGet, fnUpdate) {
        return function (req) {
            viewHelpers.beforeLeague(req, function (updateEvents, cb) {
                var inputs;

                inputs = fnGet(req);
                fnUpdate(inputs, updateEvents, cb);  // Does this work?
            });
        };
    }

    function post(fnPost) {
        return function (req) {
            viewHelpers.beforeLeague(req, function () {
                fnPost(req);
            });
        };
    }

    function init(args) {
        var output;

        args.InitViewModel = args.InitViewModel !== undefined ? args.InitViewModel : function () { };
        args.get = args.get !== undefined ? args.get : function () { return {}; };
        args.runWhenever = args.runWhenever !== undefined ? args.runWhenever : [];
        args.mapping = args.mapping !== undefined ? args.mapping : {};

        output = {};
        output.update = update(args);
        output.get = get(args.get, output.update);
        if (args.post !== undefined) {
            output.post = post(args.post);
        }

        return output;
    }

    return {
        init: init
    };
});