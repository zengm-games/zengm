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
                source += series.home.seed() + '. <a href="' + helpers.leagueUrl(["roster", series.home.abbrev(), season]) + '">' + series.home.name() + '</a>';
                if (series.home.hasOwnProperty("won")) { source += ' ' + series.home.won(); }
                if (series.home.hasOwnProperty("won") && series.home.won() === 4) { source += '</strong>'; }
                source += '<br>';

                if (series.home.hasOwnProperty("won") && series.away.won() === 4) { source += '<strong>'; }
                source += series.away.seed() + '. <a href="' + helpers.leagueUrl(["roster", series.away.abbrev(), season]) + '">' + series.away.name() + '</a>';
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
                url = helpers.leagueUrl(args);
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
                    toAttr[attr] = helpers.leagueUrl(args[attr]);
                }
            }

            return ko.bindingHandlers.attr.update(element, function () {
                return toAttr;
            });
        }
    };

    ko.bindingHandlers.dropdown = {
        init: function () {
            // http://www.knockmeout.net/2012/05/quick-tip-skip-binding.html
            return {
                controlsDescendantBindings: true
            };
        },
        update: function (element, valueAccessor) {
            var arg = valueAccessor();
            return ko.bindingHandlers.html.update(element, function () {
                return '<form id="' + arg + '-dropdown" class="form-inline pull-right">' +
                       '<!-- ko foreach: fields -->' +
                         '<select data-bind="attr: {id: id, class: name}, options: options, optionsText: \'val\', optionsValue: \'key\', value: selected">' +
                         '</select>' +
                       '<!-- /ko -->' +
                       '</form>';
            });
        }
    };

    ko.bindingHandlers.recordAndPlayoffs = {
        update: function (element, valueAccessor) {
            var abbrev, args, extraText, lost, option, output, playoffRoundsWon, season, won;


            args = valueAccessor();
            abbrev = ko.utils.unwrapObservable(args[0]);
            season = ko.utils.unwrapObservable(args[1]);
            won = ko.utils.unwrapObservable(args[2]);
            lost = ko.utils.unwrapObservable(args[3]);
            playoffRoundsWon = ko.utils.unwrapObservable(args[4]);
            option = args.length > 5 ? ko.utils.unwrapObservable(args[5]) : null;

            extraText = "";
            if (playoffRoundsWon === 4) {
                extraText = "league champs";
            } else if (playoffRoundsWon === 3) {
                extraText = "conference champs";
            } else if (playoffRoundsWon === 2) {
                extraText = "made conference finals";
            } else if (playoffRoundsWon === 1) {
                extraText = "made second round";
            } else if (playoffRoundsWon === 0) {
                extraText = "made playoffs";
            }

            output = '';
            if (option !== "noSeason") {
                output += '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + season + '</a>: ';
            }
            output += '<a href="' + helpers.leagueUrl(["standings", season]) + '">' + won + '-' + lost + '</a>';
            if (extraText) {
                output += ', <a href="' + helpers.leagueUrl(["playoffs", season]) + '">' + extraText + '</a>';
            }

            return ko.bindingHandlers.html.update(element, function () {
                return output;
            });
        }
    };
});