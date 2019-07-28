// @flow

import { PLAYER } from "../../../common";
import { draft, player, season, team } from "..";
import { idb } from "../../db";
import {
    achievement,
    defaultGameAttributes,
    g,
    genMessage,
    helpers,
    local,
    overrides,
    toUI,
} from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseBeforeDraft = async (
    conditions: Conditions,
    liveGameSim?: boolean = false,
) => {
    achievement.check("afterPlayoffs", conditions);

    if (!overrides.core.season.doAwards) {
        throw new Error("Missing overrides.core.season.doAwards");
    }
    await overrides.core.season.doAwards(conditions);

    const teams = await idb.getCopies.teamsPlus({
        attrs: ["tid"],
        seasonAttrs: ["playoffRoundsWon"],
        season: g.season,
    });

    // Give award to all players on the championship team
    const t = teams.find(
        t2 =>
            t2.seasonAttrs.playoffRoundsWon === g.numGamesPlayoffSeries.length,
    );
    if (t !== undefined) {
        const players = await idb.cache.players.indexGetAll(
            "playersByTid",
            t.tid,
        );
        for (const p of players) {
            p.awards.push({ season: g.season, type: "Won Championship" });
            await idb.cache.players.put(p);
        }
    }

    // Do annual tasks for each player, like checking for retirement

    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    for (const p of players) {
        let update = false;

        if (player.shouldRetire(p)) {
            player.retire(p, conditions);
            update = true;
        }

        // Update "free agent years" counter and retire players who have been free agents for more than one years
        if (p.tid === PLAYER.FREE_AGENT) {
            if (p.yearsFreeAgent >= 1) {
                player.retire(p, conditions);
                update = true;
            } else {
                p.yearsFreeAgent += 1;
            }
            p.contract.exp += 1;
            update = true;
        } else if (p.tid >= 0 && p.yearsFreeAgent > 0) {
            p.yearsFreeAgent = 0;
            update = true;
        }

        // Heal injures
        if (p.injury.type !== "Healthy") {
            // This doesn't use g.numGames because that would unfairly make injuries last longer if it was lower - if anything injury duration should be modulated based on that, but oh well
            if (p.injury.gamesRemaining <= defaultGameAttributes.numGames) {
                p.injury = { type: "Healthy", gamesRemaining: 0 };
            } else {
                p.injury.gamesRemaining -= defaultGameAttributes.numGames;
            }
            update = true;
        }

        if (update) {
            await idb.cache.players.put(p);
        }
    }

    const releasedPlayers = await idb.cache.releasedPlayers.getAll();
    for (const rp of releasedPlayers) {
        if (rp.contract.exp <= g.season && typeof rp.rid === "number") {
            await idb.cache.releasedPlayers.delete(rp.rid);
        }
    }

    await team.updateStrategies();

    achievement.check("afterAwards", conditions);

    const deltas = await season.updateOwnerMood();
    await genMessage(deltas);

    if (g.gameOver) {
        achievement.check("afterFired", conditions);
    }

    if (g.draftType === "noLottery") {
        await draft.genOrder(false, conditions);
    }

    // Don't redirect if we're viewing a live game now
    let url;
    if (!liveGameSim) {
        url = helpers.leagueUrl(["history"]);
    } else {
        local.unviewedSeasonSummary = true;
    }

    toUI(["bbgmPing", "season", g.season], conditions);

    return [url, ["playerMovement"]];
};

export default newPhaseBeforeDraft;
