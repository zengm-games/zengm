/**
 * @name util.templateHelpers
 * @namespace Handlebars helper functions. Any new helpers added here should be added to the handlebars call in the Makefile.
 */
define(["globals", "lib/handlebars.runtime", "lib/knockout", "util/helpers"], function (g, Handlebars, ko, helpers) {
    "use strict";

    Handlebars.registerHelper("round", helpers.round);
    ko.bindingHandlers.round = {
        update: function (element, valueAccessor) {
            var args = valueAccessor();
            return ko.bindingHandlers.text.update(element, function () {
                return helpers.round(ko.utils.unwrapObservable(args[0]), args[1]);
            });
        }
    };

    Handlebars.registerHelper("roundWinp", function (value) {
        var output;

        output = parseFloat(value).toFixed(3);

        if (output[0] === "0") {
            // Delete leading 0
            output = output.slice(1, output.length);
        } else {
            // Delete trailing digit if no leading 0
            output = output.slice(0, output.length - 1);
        }

        return output;
    });

    // It would be better if this took the series object directly, but handlebars doesn't like doing that
    Handlebars.registerHelper("matchup", function (i, j) {
        var series, source, template;

        series = this.series[i][j];

        source = '';
        if (series && series.home.name) {
            if (series.home.won === 4) { source += '<strong>'; }
            source += series.home.seed + '. <a href="/l/' + this.lid + '/roster/' + series.home.abbrev + '/' + this.season + '">' + series.home.name + '</a>';
            if (series.home.hasOwnProperty("won")) { source += ' ' + series.home.won; }
            if (series.home.won === 4) { source += '</strong>'; }
            source += '<br>';

            if (series.away.won === 4) { source += '<strong>'; }
            source += series.away.seed + '. <a href="/l/' + this.lid + '/roster/' + series.away.abbrev + '/' + this.season + '">' + series.away.name + '</a>';
            if (series.away.hasOwnProperty("won")) { source += ' ' + series.away.won; }
            if (series.away.won === 4) { source += '</strong>'; }
        }

        return new Handlebars.SafeString(source);
    });


    Handlebars.registerHelper("face", function (face) {
        return new Handlebars.SafeString('<script>'
             + '$(document).ready(function() {'
             + '  faces.display("picture", ' + JSON.stringify(face) + ');'
             + '});'
             + '</script>');
    });


    Handlebars.registerHelper("new_window", function () {
        return new Handlebars.SafeString('<a href="javascript:(function () { api = require(\'api\'); api.moveToNewWindow(); }())" class="new_window" title="Move To New Window" data-no-davis="true"><img src="/ico/new_window.png" height="16" width="16"></a>');
    });


    Handlebars.registerHelper("skillsBlock", function (skills) {
        return new Handlebars.SafeString(helpers.skillsBlock(skills));
    });

    Handlebars.registerHelper("currency", helpers.formatCurrency);
    ko.bindingHandlers.currency = {
        update: function (element, valueAccessor) {
            var args = valueAccessor();
            return ko.bindingHandlers.text.update(element, function () {
                return helpers.formatCurrency(ko.utils.unwrapObservable(args[0]), args[1]);
            });
        }
    };

    Handlebars.registerHelper("numberWithCommas", helpers.numberWithCommas);

    Handlebars.registerHelper("playerNameLabels", function (pid, name, injury, skills) {
        return new Handlebars.SafeString(helpers.playerNameLabels(pid, name, injury, skills));
    });
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