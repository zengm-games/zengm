// @flow

import { league } from "../core";
import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import local from "./local";
import type { OwnerMood } from "../../common/types";

const getMoodText = (total: number, deltas: boolean = false) => {
    if (total > (deltas ? 0.5 : 2)) {
        return "Excellent!";
    }
    if (total > (deltas ? 0.25 : 1)) {
        return "Good.";
    }
    if (total > 0) {
        return "Pretty good.";
    }
    if (total > (deltas ? -0.25 : -0.5)) {
        return "Bad.";
    }
    return "Horrible!";
};

const genMessage = async (deltas: OwnerMood) => {
    // If auto play seasons or multi team mode, no messages
    if (local.autoPlaySeasons > 0 || g.userTids.length > 1) {
        return;
    }

    // No need for seasons before you GMed this team or more than 10 years old, but also make sure we always have g.season
    const minSeason = Math.min(
        g.season,
        Math.max(g.gracePeriodEnd - 2, g.season - 9),
    );

    const teamSeasons = await idb.getCopies.teamSeasons({
        tid: g.userTid,
        seasons: [minSeason, g.season],
    });

    const moods = teamSeasons.map(ts => {
        return ts.ownerMood
            ? ts.ownerMood
            : {
                  money: 0,
                  playoffs: 0,
                  wins: 0,
              };
    });

    const currentMood = moods[moods.length - 1];
    const currentTotal =
        currentMood.wins + currentMood.playoffs + currentMood.money;

    const fired =
        currentTotal <= -1 && g.season >= g.gracePeriodEnd && !g.godMode;

    let m = "";
    if (!fired) {
        let overall;
        if (g.season < g.gracePeriodEnd) {
            overall = "It's too early to judge you.";
        } else if (g.godMode) {
            overall = "You're using God Mode, so who cares what I think?";
        } else {
            overall = getMoodText(currentTotal);
        }

        const deltasTotal = deltas.wins + deltas.playoffs + deltas.money;
        const thisYear = getMoodText(deltasTotal, true);

        let text;
        if (currentTotal > 0) {
            if (deltas.playoffs > 0 && deltas.wins > 0) {
                if (deltas.money < 0) {
                    text =
                        "Keep it up, but be careful about losing too much money.";
                }
            } else {
                text = "Hopefully you'll win some more games next season.";
            }
        } else if (deltas.playoffs > 0 && deltas.wins > 0 && deltas.money > 0) {
            text = "Keep it up.";
        } else if (deltas.playoffs < 0 && deltas.money < 0) {
            text = "Somehow you need to win more and make more money.";
        } else if (deltas.playoffs < 0) {
            text = "Win some more games next season.";
        } else if (deltas.money < 0) {
            text = "Be careful about losing too much money.";
        }
        if (currentTotal + deltas.money + deltas.playoffs + deltas.wins < -1) {
            text = "Another season like that and you're fired!";
        } else if (
            currentTotal + 2 * (deltas.money + deltas.playoffs + deltas.wins) <
            -1
        ) {
            text = "A couple more seasons like that and you're fired!";
        }

        m += `<p>This year: ${thisYear}</p><p>Overall: ${overall}</p>`;
        if (text) {
            m += `<p>${text}</p>`;
        }
    } else {
        // Fired!

        if (
            currentMood.wins < 0 &&
            currentMood.playoffs < 0 &&
            currentMood.money < 0
        ) {
            m +=
                "<p>You've been an all-around disappointment. You're fired.</p>";
        } else if (
            currentMood.money < 0 &&
            currentMood.wins >= 0 &&
            currentMood.playoffs >= 0
        ) {
            m +=
                "<p>You've won some games, but you're just not making me enough profit. It's not all about wins and losses, dollars matter too. You're fired.</p>";
        } else if (
            currentMood.money >= 0 &&
            currentMood.wins < 0 &&
            currentMood.playoffs < 0
        ) {
            m += `<p>I like that you've made a nice profit for me, but you're not putting a competitive team on the ${
                process.env.SPORT === "basketball" ? "court" : "field"
            }. We need a new direction. You're fired.</p>`;
        } else {
            m += "<p>You're fired.</p>";
        }
        m += `<p>I hear a few other teams are looking for a new GM. <a href="${helpers.leagueUrl(
            ["new_team"],
        )}">Take a look.</a> Please, go run one of those teams into the ground.</p>`;

        await league.setGameAttributes({
            gameOver: true,
        });
    }

    await idb.cache.messages.add({
        read: false,
        from: "The Owner",
        year: g.season,
        text: m,
        subject: "Annual performance evaluation",
        ownerMoods: moods,
    });
};

export default genMessage;
