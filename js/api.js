const g = require('./globals');
const ui = require('./ui');
const freeAgents = require('./core/freeAgents');
const game = require('./core/game');
const league = require('./core/league');
const phase = require('./core/phase');
const season = require('./core/season');
const $ = require('jquery');

async function play(amount) {
    let numDays;

    if (['day', 'week', 'month', 'throughPlayoffs', 'untilPreseason'].indexOf(amount) >= 0) {
        if (amount === "day") {
            numDays = 1;
        } else if (amount === "week") {
            numDays = 7;
        } else if (amount === "month") {
            numDays = 30;
        } else if (amount === "throughPlayoffs") {
            numDays = 100;  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
        } else if (amount === "untilPreseason") {
            numDays = g.daysLeft;
        }

        if (g.phase <= g.PHASE.PLAYOFFS) {
            ui.updateStatus("Playing..."); // For quick UI updating, before game.play
            // Start playing games
            game.play(numDays);
        } else if (g.phase === g.PHASE.FREE_AGENCY) {
            if (numDays > g.daysLeft) {
                numDays = g.daysLeft;
            }
            freeAgents.play(numDays);
        }
    } else if (amount === "untilPlayoffs") {
        if (g.phase < g.PHASE.PLAYOFFS) {
            ui.updateStatus("Playing..."); // For quick UI updating, before game.play
            await season.getDaysLeftSchedule();
            game.play();
        }
    } else if (amount === "stop") {
        await league.setGameAttributesComplete({stopGames: true});
        if (g.phase !== g.PHASE.FREE_AGENCY) {
            // This is needed because we can't be sure if core.game.play will be called again
            ui.updateStatus("Idle");
        }
        await league.setGameAttributesComplete({gamesInProgress: false});
        ui.updatePlayMenu(null);
    } else if (amount === "untilDraft") {
        if (g.phase === g.PHASE.BEFORE_DRAFT) {
            phase.newPhase(g.PHASE.DRAFT);
        }
    } else if (amount === "untilResignPlayers") {
        if (g.phase === g.PHASE.AFTER_DRAFT) {
            phase.newPhase(g.PHASE.RESIGN_PLAYERS);
        }
    } else if (amount === "untilFreeAgency") {
        if (g.phase === g.PHASE.RESIGN_PLAYERS) {
            const numRemaining = await g.dbl.negotiations.count();
            // Show warning dialog only if there are players remaining un-re-signed
            if (numRemaining === 0 || window.confirm(`Are you sure you want to proceed to free agency while ${numRemaining} of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.`)) {
                await phase.newPhase(g.PHASE.FREE_AGENCY);
                ui.updateStatus(`${g.daysLeft} days left`);
            }
        }
    } else if (amount === "untilRegularSeason") {
        if (g.phase === g.PHASE.PRESEASON) {
            phase.newPhase(g.PHASE.REGULAR_SEASON);
        }
    } else if (amount === "stopAutoPlay") {
        await league.setGameAttributesComplete({autoPlaySeasons: 0});
        ui.updatePlayMenu(null);
        play("stop");

        // Extra toggle to counteract play("stop");
        $("#play-menu .dropdown-toggle").dropdown("toggle");
    }

    // Close the menu
    $("#play-menu .dropdown-toggle").dropdown("toggle");
}

module.exports = {
    play
};
