Handlebars.registerHelper("round", function (value, precision) {
    "use strict";

    precision = precision !== undefined ? parseInt(precision, 10) : 0;

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

// It would be better if this took the series object directly, but handlebars doesn't like doing that
Handlebars.registerHelper("matchup", function (i, j) {
    "use strict";

    var series, source, template;

    series = this.series[i][j];

    source = '{{#if series.home.name}}' +
             '  {{#if series.home.wonSeries}}<strong>{{/if}}{{series.home.seed}}. <a href="/l/{{lid}}/roster/{{series.home.abbrev}}/{{season}}">{{series.home.name}}</a> {{series.home.won}}{{#if series.home.wonSeries}}</strong>{{/if}}<br>' +
             '  {{#if series.away.wonSeries}}<strong>{{/if}}{{series.away.seed}}. <a href="/l/{{lid}}/roster/{{series.away.abbrev}}/{{season}}">{{series.away.name}}</a> {{series.away.won}}{{#if series.away.wonSeries}}</strong>{{/if}}' +
             '{{/if}}';
    template = Handlebars.compile(source);
    return new Handlebars.SafeString(template({lid: this.lid, season: this.season, series: series}));
});


Handlebars.registerHelper("face", function (face) {
    "use strict";

    return new Handlebars.SafeString('<script>'
         + '$(document).ready(function() {'
         + '  faces.display("picture", ' + JSON.stringify(face) + ');'
         + '});'
         + '</script>');
});


Handlebars.registerHelper("new_window", function () {
    "use strict";

    return new Handlebars.SafeString('<a href="javascript:api.moveToNewWindow()" class="new_window" title="Move To New Window" data-no-davis="true"><img src="/ico/new_window.png" height="16" width="16"></a>');
});


Handlebars.registerHelper("skills_block", function (skills) {
    "use strict";

    var i, skillsHtml, tooltips;

    tooltips = {
        "3": "Three Point Shooter",
        A: "Athlete",
        B: "Ball Handler",
        Di: "Interior Defender",
        Dp: "Perimeter Defender",
        Po: "Post Scorer",
        Ps: "Passer",
        R: "Rebounder"
    }

    skillsHtml = '';
    for (i = 0; i < skills.length; i++) {
        skillsHtml += '<span class="skill" title="' + tooltips[skills[i]] + '">' + skills[i] + '</span>';
    }

    return new Handlebars.SafeString(skillsHtml);
});