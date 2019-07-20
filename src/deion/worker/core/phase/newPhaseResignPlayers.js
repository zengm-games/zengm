// @flow

import orderBy from "lodash/orderBy";
import { PHASE, PLAYER } from "../../../common";
import { contractNegotiation, draft, league, player, team } from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent, overrides } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseResignPlayers = async (conditions: Conditions) => {
    await idb.cache.negotiations.clear();

    const baseMoodsReSigning = await player.genBaseMoods(true);
    const baseMoodsFreeAgents = await player.genBaseMoods(false);

    // Reset contract demands of current free agents and undrafted players
    // KeyRange only works because PLAYER.UNDRAFTED is -2 and PLAYER.FREE_AGENT is -1
    const existingFreeAgents = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.FREE_AGENT,
    );
    const undraftedPlayers = (await idb.cache.players.indexGetAll(
        "playersByDraftYearRetiredYear",
        [[g.season], [g.season, Infinity]],
    )).filter(p => p.tid === PLAYER.UNDRAFTED);
    for (const p of [...existingFreeAgents, ...undraftedPlayers]) {
        player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoodsFreeAgents);
        await idb.cache.players.put(p);
    }

    const teams = await idb.getCopies.teamsPlus({
        attrs: ["strategy"],
        season: g.season,
    });
    const strategies = teams.map(t => t.strategy);

    // Re-sign players on user's team, and some AI players
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        0,
        Infinity,
    ]);

    // Figure out how many players are needed at each position, beyond who is already signed
    const neededPositionsByTid = new Map();
    if (Object.keys(overrides.common.constants.POSITION_COUNTS).length > 0) {
        for (let tid = 0; tid < g.numTeams; tid++) {
            const counts = {
                ...overrides.common.constants.POSITION_COUNTS,
            };
            neededPositionsByTid.set(tid, counts);
        }
        for (const p of players) {
            if (p.contract.exp <= g.season) {
                continue;
            }

            const counts = neededPositionsByTid.get(p.tid);
            const pos = p.ratings[p.ratings.length - 1].pos;

            if (counts !== undefined && counts[pos] !== undefined) {
                counts[pos] -= 1;
            }
        }
    }

    const payrollsByTid = new Map();
    if (g.hardCap) {
        for (let tid = 0; tid < g.numTeams; tid++) {
            const payroll = await team.getPayroll(tid);

            const expiringPayroll = players
                .filter(p => p.tid === tid && p.contract.exp <= g.season)
                .reduce((total, p) => total + p.contract.amount, 0);

            payrollsByTid.set(tid, payroll - expiringPayroll);
        }
    }

    const playersSorted = orderBy(
        players,
        [
            "tid",
            p => {
                return g.hardCap && p.draft.year === g.season ? 1 : -1;
            },
            "value",
        ],
        ["asc", "desc", "desc"],
    );
    for (const p of playersSorted) {
        if (p.contract.exp <= g.season) {
            const draftPick = g.hardCap && p.draft.year === g.season;

            if (g.userTids.includes(p.tid) && local.autoPlaySeasons === 0) {
                const tid = p.tid;

                // Add to free agents first, to generate a contract demand, then open negotiations with player
                player.addToFreeAgents(
                    p,
                    PHASE.RESIGN_PLAYERS,
                    baseMoodsReSigning,
                );
                if (draftPick) {
                    p.contract.amount /= 2;
                    if (p.contract.amount < g.minContract) {
                        p.contract.amount = g.minContract;
                    } else {
                        p.contract.amount =
                            50 * Math.round(p.contract.amount / 50); // Make it a multiple of 50k
                    }
                }
                await idb.cache.players.put(p);

                const error = await contractNegotiation.create(
                    p.pid,
                    true,
                    tid,
                    p.draft.year === g.season,
                );
                if (error !== undefined && error) {
                    logEvent(
                        {
                            type: "refuseToSign",
                            text: error,
                            pids: [p.pid],
                            tids: [tid],
                        },
                        conditions,
                    );
                }
            } else {
                // AI teams
                const counts = neededPositionsByTid.get(p.tid);
                const pos = p.ratings[p.ratings.length - 1].pos;

                const factor = strategies[p.tid] === "rebuilding" ? 0.4 : 0;
                let probReSign = p.value / 100 - factor;

                // Make it less likely to re-sign players based on roster needs
                if (
                    counts !== undefined &&
                    counts[pos] !== undefined &&
                    counts[pos] <= 0
                ) {
                    probReSign -= 0.25;
                }

                const payroll = payrollsByTid.get(p.tid);
                const contract = player.genContract(p);

                // Always sign rookies, and give them smaller contracts
                if (draftPick) {
                    contract.amount /= 2;
                    if (contract.amount < g.minContract) {
                        contract.amount = g.minContract;
                    } else {
                        contract.amount = 50 * Math.round(contract.amount / 50); // Make it a multiple of 50k
                    }

                    if (p.draft.round <= 3) {
                        probReSign = 1;
                    } else if (p.draft.round <= 5) {
                        probReSign += 0.35;
                    } else if (p.draft.round <= 7) {
                        probReSign += 0.25;
                    } else if (p.draft.round <= 8) {
                        probReSign += 0.15;
                    }
                }

                if (g.hardCap) {
                    if (payroll === undefined) {
                        throw new Error(
                            "Payroll should always be defined if there is a hard cap",
                        );
                    }

                    if (contract.amount + payroll > g.salaryCap) {
                        probReSign = 0;
                    }
                }

                // Should eventually be smarter than a coin flip
                if (Math.random() < probReSign) {
                    contract.exp += 1; // Otherwise contracts could expire this season
                    player.sign(p, p.tid, contract, PHASE.RESIGN_PLAYERS);

                    if (counts !== undefined && counts[pos] !== undefined) {
                        counts[pos] -= 1;
                    }
                    if (payroll !== undefined) {
                        payrollsByTid.set(p.tid, contract.amount + payroll);
                    }
                } else {
                    player.addToFreeAgents(
                        p,
                        PHASE.RESIGN_PLAYERS,
                        baseMoodsFreeAgents,
                    );
                }

                await idb.cache.players.put(p);
            }
        }
    }

    // Bump up future draft classes (not simultaneous so tid updates don't cause race conditions)
    const draftProspects = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED,
    );
    for (const p of draftProspects) {
        if (p.draft.year !== g.season + 1) {
            continue;
        }
        p.ratings[0].fuzz /= Math.sqrt(2);
        player.develop(p, 0); // Update skills/pot based on fuzz
        player.updateValues(p);
        await idb.cache.players.put(p);
    }
    for (const p of draftProspects) {
        if (p.draft.year !== g.season + 2) {
            continue;
        }
        p.ratings[0].fuzz /= Math.sqrt(2);
        player.develop(p, 0); // Update skills/pot based on fuzz
        player.updateValues(p);
        await idb.cache.players.put(p);
    }

    // Generate a new draft class, while leaving existing players in that draft class in place
    const baseNumPlayers = Math.round((g.numDraftRounds * g.numTeams * 7) / 6);
    const numPlayersAlreadyInDraftClass = draftProspects.filter(
        p => p.draft.year === g.season + 3,
    ).length;
    await draft.genPlayers(
        g.season + 3,
        undefined,
        baseNumPlayers - numPlayersAlreadyInDraftClass,
    );

    // Delete any old undrafted players that still somehow exist
    for (const p of draftProspects) {
        if (p.draft.year <= g.season) {
            await idb.cache.players.delete(p.pid);
        }
    }

    // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
    await league.setGameAttributes({ daysLeft: 30 });

    return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
};

export default newPhaseResignPlayers;
