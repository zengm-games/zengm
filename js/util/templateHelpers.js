/**
 * @name util.templateHelpers
 * @namespace Knockout helper functions.
 */
define(["globals", "lib/faces", "lib/knockout", "util/helpers"], function (g, faces, ko, helpers) {
    "use strict";

    ko.bindingHandlers.round = {
        update: function (element, valueAccessor) {
            var args = valueAccessor();
            return ko.bindingHandlers.text.update(element, function () {
                return helpers.round(ko.utils.unwrapObservable(args[0]), args[1]);
            });
        }
    };

    ko.bindingHandlers.roundWinp = {
        update: function (element, valueAccessor) {
            var arg, output;

            arg = ko.utils.unwrapObservable(valueAccessor());

            output = parseFloat(arg).toFixed(3);

            if (output[0] === "0") {
                // Delete leading 0
                output = output.slice(1, output.length);
            } else {
                // Delete trailing digit if no leading 0
                output = output.slice(0, output.length - 1);
            }

            return ko.bindingHandlers.text.update(element, function () {
                return output;
            });
        }
    };

    // It would be better if this took the series object directly
    ko.bindingHandlers.matchup = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var args, season, series, source;

            args = valueAccessor();

            season = viewModel.season();
            series = viewModel.series()[args[0]][args[1]];

            source = '';
            if (series && series.home.name) {
                if (series.home.hasOwnProperty("won") && series.home.won() === 4) { source += '<strong>'; }
                source += series.home.seed() + '. <a href="/l/' + g.lid + '/roster/' + series.home.abbrev() + '/' + season + '">' + series.home.name() + '</a>';
                if (series.home.hasOwnProperty("won")) { source += ' ' + series.home.won(); }
                if (series.home.hasOwnProperty("won") && series.home.won() === 4) { source += '</strong>'; }
                source += '<br>';

                if (series.home.hasOwnProperty("won") && series.away.won() === 4) { source += '<strong>'; }
                source += series.away.seed() + '. <a href="/l/' + g.lid + '/roster/' + series.away.abbrev() + '/' + season + '">' + series.away.name() + '</a>';
                if (series.away.hasOwnProperty("won")) { source += ' ' + series.away.won(); }
                if (series.home.hasOwnProperty("won") && series.away.won() === 4) { source += '</strong>'; }
            }

            return ko.bindingHandlers.html.update(element, function () {
                return source;
            });
        }
    };

    ko.bindingHandlers.newWindow = {
        update: function (element, valueAccessor) {
            var args, i, url;

            args = valueAccessor();

            if (args.length === 0) {
                url = document.URL;
            } else {
                url = "/l/" + g.lid;
                for (i = 0; i < args.length; i++) {
                    url += "/" + ko.utils.unwrapObservable(args[i]);
                }
            }

            return ko.bindingHandlers.html.update(element, function () {
                // Window name is set to the current time, so each window has a unique name and thus a new window is always opened
                return '<a href="javascript:(function () { window.open(\'' + url + '?w=popup\', Date.now(), \'height=600,width=800,scrollbars=yes\'); }())" class="new_window" title="Move To New Window" data-no-davis="true"><img src="/ico/new_window.png" height="16" width="16"></a>';
            });
        }
    };

    ko.bindingHandlers.skillsBlock = {
        update: function (element, valueAccessor) {
            var arg = valueAccessor();
            return ko.bindingHandlers.html.update(element, function () {
                return helpers.skillsBlock(ko.utils.unwrapObservable(arg));
            });
        }
    };

    ko.bindingHandlers.currency = {
        update: function (element, valueAccessor) {
            var args = valueAccessor();
            return ko.bindingHandlers.text.update(element, function () {
                return helpers.formatCurrency(ko.utils.unwrapObservable(args[0]), args[1]);
            });
        }
    };

    ko.bindingHandlers.numberWithCommas = {
        update: function (element, valueAccessor) {
            var args = valueAccessor();
            return ko.bindingHandlers.text.update(element, function () {
                return helpers.numberWithCommas(ko.utils.unwrapObservable(args));
            });
        }
    };

    ko.bindingHandlers.playerNameLabels = {
        update: function (element, valueAccessor) {
            var args = valueAccessor();
            return ko.bindingHandlers.html.update(element, function () {
                return helpers.playerNameLabels(ko.utils.unwrapObservable(args[0]), ko.utils.unwrapObservable(args[1]), ko.utils.unwrapObservable(args[2]), ko.utils.unwrapObservable(args[3]));
            });
        }
    };

    ko.bindingHandlers.attrLeagueUrl = {
        update: function (element, valueAccessor) {
            var args, attr, i, url, toAttr;

            args = valueAccessor();
            toAttr = {};

            for (attr in args) {
                if (args.hasOwnProperty(attr)) {
                    toAttr[attr] = "/l/" + g.lid;
                    for (i = 0; i < args[attr].length; i++) {
                        toAttr[attr] += "/" + ko.utils.unwrapObservable(args[attr][i]);
                    }
                }
            }

            return ko.bindingHandlers.attr.update(element, function () {
                return toAttr;
            });
        }
    };
});