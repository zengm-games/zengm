/**
 * @name util.templateHelpers
 * @namespace Handlebars helper functions.
 */
define(["lib/handlebars.runtime", "util/helpers"], function (Handlebars, helpers) {
    "use strict";

    Handlebars.registerHelper("round", helpers.round);

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


    Handlebars.registerHelper("skills_block", function (skills) {
        return new Handlebars.SafeString(helpers.skillsBlock(skills));
    });
});