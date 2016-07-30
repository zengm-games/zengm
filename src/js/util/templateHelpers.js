const g = require('../globals');
const ko = require('knockout');
const helpers = require('./helpers');

ko.bindingHandlers.round = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        return ko.bindingHandlers.text.update(element, () => helpers.round(ko.unwrap(args[0]), args[1]));
    },
};

ko.bindingHandlers.roundWinp = {
    update: (element, valueAccessor) => {
        const arg = ko.unwrap(valueAccessor());

        return ko.bindingHandlers.text.update(element, () => helpers.roundWinp(arg));
    },
};

// It would be better if this took the series object directly
ko.bindingHandlers.matchup = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();

        const matchup = args[0];
        const season = args[2];
        const series = args[1][matchup[0]][matchup[1]];

        let source = '';
        if (series && series.home.tid) {
            if (series.home.tid() === g.userTid) { source += '<span class="bg-info">'; }
            if (series.home.hasOwnProperty("won") && series.home.won() === 4) { source += '<strong>'; }
            source += `${series.home.seed()}. <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[series.home.tid()], season])}">${g.teamRegionsCache[series.home.tid()]}</a>`;
            if (series.home.hasOwnProperty("won")) { source += ` ${series.home.won()}`; }
            if (series.home.hasOwnProperty("won") && series.home.won() === 4) { source += '</strong>'; }
            if (series.home.tid() === g.userTid) { source += '</span>'; }
            source += '<br>';

            if (series.away.tid() === g.userTid) { source += '<span class="bg-info">'; }
            if (series.home.hasOwnProperty("won") && series.away.won() === 4) { source += '<strong>'; }
            source += `${series.away.seed()}. <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[series.away.tid()], season])}">${g.teamRegionsCache[series.away.tid()]}</a>`;
            if (series.away.hasOwnProperty("won")) { source += ` ${series.away.won()}`; }
            if (series.home.hasOwnProperty("won") && series.away.won() === 4) { source += '</strong>'; }
            if (series.away.tid() === g.userTid) { source += '</span>'; }
        }

        return ko.bindingHandlers.html.update(element, () => source);
    },
};

ko.bindingHandlers.newWindow = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();

        let url;
        if (args.length === 0) {
            url = document.URL;
        } else {
            url = helpers.leagueUrl(args);
        }

        return ko.bindingHandlers.html.update(element, () => {
            // Window name is set to the current time, so each window has a unique name and thus a new window is always opened
            return `<a href="javascript:(function () { window.open('${url}?w=popup', Date.now(), 'height=600,width=800,scrollbars=yes'); }())" class="new_window" title="Move To New Window" data-no-davis="true"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA0AAAANABeWPPlAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFOSURBVDiNlZS9isJAFIU/F6s0m0VYYiOrhVukWQsbK4t9CDtbexGs8xY+ghY+QRBsbKcTAjZaqKyGXX2Bs00S1AwBD1yYOXPvmXvv/CAJSQAuoGetzAPCMKRSqTzSOURRRK/Xo1wqldyEewXwfR/P8zLHIAhYr9fZ3BjDeDym1WoBUAZ+i3ZaLBYsl8s7zhiTCbwk3DfwaROYz+fsdjs6nU7GOY6TjVOBGPixCbiuy2g0YrVa0Ww2c+svlpg7DAYDptMp3W6XyWRi9RHwRXKMh8NBKYbDoQC1221dr1dtNhv1+33NZjMZY9KjtAsEQSBAvu/rfD7rEYUC2+1WjuOo0Whov9/ngm8FchcJoFarEYYhnudRrVYLe5QTOJ1OANTrdQCOx6M1MI5jexOftdsMLsBbYb7wDkTAR+KflWC9hRakr+wi6e+2hGfNTb+Bf9965Lxmndc1AAAAAElFTkSuQmCC" height="16" width="16"></a>`;
        });
    },
};

ko.bindingHandlers.skillsBlock = {
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        return ko.bindingHandlers.html.update(element, () => helpers.skillsBlock(ko.unwrap(arg)));
    },
};

ko.bindingHandlers.watchBlock = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        return ko.bindingHandlers.html.update(element, () => helpers.watchBlock(ko.unwrap(args[0]), ko.unwrap(args[1])));
    },
};

ko.bindingHandlers.currency = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        return ko.bindingHandlers.text.update(element, () => helpers.formatCurrency(ko.unwrap(args[0]), args[1]));
    },
};

ko.bindingHandlers.numberWithCommas = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        return ko.bindingHandlers.text.update(element, () => helpers.numberWithCommas(ko.unwrap(args)));
    },
};

ko.bindingHandlers.playerNameLabels = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        const injury = ko.unwrap(args[2]);
        injury.type = ko.unwrap(injury.type);
        injury.gamesRemaining = ko.unwrap(injury.gamesRemaining);

        return ko.bindingHandlers.html.update(element, () => {
            return helpers.playerNameLabels(ko.unwrap(args[0]), ko.unwrap(args[1]), injury, ko.unwrap(args[3]), ko.unwrap(args[4]));
        });
    },
};

ko.bindingHandlers.attrLeagueUrl = {
    update: (element, valueAccessor, allBindingsAccessor, viewModel) => {
        const args = valueAccessor();
        const toAttr = {};

        for (const attr in args) {
            if (args.hasOwnProperty(attr)) {
                let options;
                if (attr === "action") {
                    // No query string for forms because https://github.com/olivernn/davis.js/issues/75
                    options = {noQueryString: true};
                } else {
                    options = {};
                }

                toAttr[attr] = helpers.leagueUrl(args[attr], options, viewModel.lid);
            }
        }

        return ko.bindingHandlers.attr.update(element, () => toAttr);
    },
};

ko.bindingHandlers.dropdown = {
    init: () => {
        // http://www.knockmeout.net/2012/05/quick-tip-skip-binding.html
        return {
            controlsDescendantBindings: true,
        };
    },
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        return ko.bindingHandlers.html.update(element, () => {
            return `<form id="${arg}-dropdown" class="form-inline pull-right bbgm-dropdown" role="form">
                    <!-- ko foreach: fields -->
                      <div class="form-group" style="margin-left: 4px; margin-bottom: 4px;">
                      <select data-bind="attr: {id: id, class: 'form-control ' + name}, options: options, optionsText: 'val', optionsValue: 'key', value: selected">
                      </select>
                      </div>
                    <!-- /ko -->
                    </form>`;
        });
    },
};

ko.bindingHandlers.recordAndPlayoffs = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        const abbrev = ko.unwrap(args[0]);
        const season = ko.unwrap(args[1]);
        const won = ko.unwrap(args[2]);
        const lost = ko.unwrap(args[3]);
        const playoffRoundsWon = args.length > 4 ? ko.unwrap(args[4]) : null;
        const option = args.length > 5 ? ko.unwrap(args[5]) : null;

        return ko.bindingHandlers.html.update(element, () => helpers.recordAndPlayoffs(abbrev, season, won, lost, playoffRoundsWon, option));
    },
};

ko.bindingHandlers.roundsWonText = {
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        return ko.bindingHandlers.html.update(element, () => helpers.roundsWonText(ko.unwrap(arg)));
    },
};

ko.bindingHandlers.draftAbbrev = {
    update: (element, valueAccessor) => {
        const args = valueAccessor();
        return ko.bindingHandlers.html.update(element, () => helpers.draftAbbrev(ko.unwrap(args[0]), ko.unwrap(args[1])));
    },
};

ko.bindingHandlers.ordinal = {
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        return ko.bindingHandlers.html.update(element, () => helpers.ordinal(parseInt(ko.unwrap(arg), 10)));
    },
};

ko.bindingHandlers.gameScore = {
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        const newArg = {}; // To prevent unwrapping the underlying observable
        for (const stat in arg) {
            if (arg.hasOwnProperty(stat)) {
                newArg[stat] = ko.unwrap(arg[stat]);
            }
        }
        return ko.bindingHandlers.html.update(element, () => helpers.gameScore(newArg));
    },
};

ko.bindingHandlers.multiTeamMenu = {
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        const userTid = ko.unwrap(arg[0]);
        const userTids = ko.unwrap(arg[1]);

        // Hide if not multi team or not loaded yet
        if (userTids.length <= 1 || g.teamRegionsCache === undefined) {
            return ko.bindingHandlers.visible.update(element, () => false);
        }

        ko.bindingHandlers.visible.update(element, () => true);

        const teamNames = userTids.map(tid => `${g.teamRegionsCache[tid]} ${g.teamNamesCache[tid]}`);

        let options = "";
        for (let i = 0; i < userTids.length; i++) {
            if (userTid === userTids[i]) {
                options += `<option value="${userTids[i]}" selected>${teamNames[i]}</option>`;
            } else {
                options += `<option value="${userTids[i]}">${teamNames[i]}</option>`;
            }
        }

        // Menu is triggered by jQuery code in ui.js
        return ko.bindingHandlers.html.update(element, () => {
            return `<label for="multi-team-select">Currently controlling:</label><br><select class="form-control" id="multi-team-select">${options}</select>`;
        });
    },
};

ko.bindingHandlers.plusMinus = {
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        const plusminus = ko.unwrap(arg[0]);
        const round = ko.unwrap(arg[1]);

        return ko.bindingHandlers.html.update(element, () => {
            const val = helpers.plusMinus(plusminus, round);
            return (val !== val ? "" : val);
        });
    },
};

ko.bindingHandlers.jumpToDropdown = {
    init: () => {
        // http://www.knockmeout.net/2012/05/quick-tip-skip-binding.html
        return {
            controlsDescendantBindings: true,
        };
    },
    update: (element, valueAccessor) => {
        const arg = valueAccessor();
        const season = ko.unwrap(arg);

        return ko.bindingHandlers.html.update(element, () => {
            return `<div class="btn-group pull-right">
                      <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Jump To <span class="caret"></span>
                      </button>
                      <ul class="dropdown-menu">
                        <li><a href="${helpers.leagueUrl(['standings', season])}">Standings</a></li>
                        <li><a href="${helpers.leagueUrl(['playoffs', season])}">Playoffs</a></li>
                        <li><a href="${helpers.leagueUrl(['history', season])}">Season Summary</a></li>
                        <li><a href="${helpers.leagueUrl(['league_finances', season])}">Finances</a></li>
                        <li><a href="${helpers.leagueUrl(['transactions', 'all', season])}">Transactions</a></li>
                        <li><a href="${helpers.leagueUrl(['draft_summary', season])}">Draft</a></li>
                        <li><a href="${helpers.leagueUrl(['leaders', season])}">Leaders</a></li>
                        <li><a href="${helpers.leagueUrl(['team_stats', season])}">Team Stats</a></li>
                        <li><a href="${helpers.leagueUrl(['player_stats', 'all', season])}">Player Stats</a></li>
                        <li><a href="${helpers.leagueUrl(['player_ratings', 'all', season])}">Player Ratings</a></li>
                      </ul>
                    </div>`;
        });
    },
};
