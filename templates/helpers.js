Handlebars.registerHelper("round", function (value, precision) {
    "use strict";

    precision = typeof precision !== "undefined" ? parseInt(precision, 10) : 0;

    return parseFloat(value).toFixed(precision);
});

Handlebars.registerHelper("roundWinp", function (value) {
    "use strict";
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

Handlebars.registerHelper("matchup", function (i, j) {
    "use strict";
    var series, source, template;

    series = this.series[i][j];

    source = "{{#if series.home.name}}" +
             "  {{#if series.home.wonSeries}}<strong>{{/if}}{{series.home.seed}}. {{series.home.name}} {{series.home.won}}{{#if series.home.wonSeries}}</strong>{{/if}}<br>" +
             "  {{#if series.away.wonSeries}}<strong>{{/if}}{{series.away.seed}}. {{series.away.name}} {{series.away.won}}{{#if series.away.wonSeries}}</strong>{{/if}}" +
             "{{/if}}";
    template = Handlebars.compile(source);
    return new Handlebars.SafeString(template({series: series}));
});


Handlebars.registerHelper("face", function (face) {
    "use strict";

    return new Handlebars.SafeString('<script>'
         + '$(document).ready(function() {'
         + '  faces.display("picture", ' + JSON.stringify(face) + ');'
         + '});'
         + '</script>');
});