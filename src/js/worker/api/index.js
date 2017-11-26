// @flow

import _ from "underscore";
import { PHASE, PLAYER, g, helpers } from "../../common";
import actions from "./actions";
import {
    contractNegotiation,
    draft,
    finances,
    league,
    phase,
    player,
    team,
    trade,
} from "../core";
import { connectMeta, idb } from "../db";
import {
    account,
    beforeView,
    changes,
    checkNaNs,
    env,
    local,
    lock,
    random,
    updatePlayMenu,
    updateStatus,
} from "../util";
import * as views from "../views";
import type {
    Conditions,
    Env,
    GameAttributes,
    GetOutput,
    Local,
    LockName,
    Player,
    PlayerWithoutPid,
    UpdateEvents,
} from "../../common/types";

const acceptContractNegotiation = async (
    pid: number,
    amount: number,
    exp: number,
): Promise<?string> => {
    return contractNegotiation.accept(pid, amount, exp);
};

const autoSortRoster = async () => {
    await team.rosterAutoSort(g.userTid);
};

const beforeViewLeague = async (
    newLid: number,
    loadedLid: number | void,
    conditions: Conditions,
) => {
    return beforeView.league(newLid, loadedLid, conditions);
};

const beforeViewNonLeague = async (
    loadedLid: number | void,
    conditions: Conditions,
) => {
    return beforeView.nonLeague(loadedLid, conditions);
};

const cancelContractNegotiation = async (pid: number) => {
    return contractNegotiation.cancel(pid);
};

const checkParticipationAchievement = async (
    force: boolean,
    conditions: Conditions,
) => {
    if (force) {
        await account.addAchievements(["participation"], conditions);
    } else {
        const achievements = await account.getAchievements();
        if (achievements[0].count === 0) {
            await account.addAchievements(["participation"], conditions);
        }
    }
};

const clearWatchList = async () => {
    const pids = new Set();

    const players = await idb.cache.players.getAll();
    for (const p of players) {
        if (p.watch && typeof p.watch !== "function") {
            p.watch = false;
            await idb.cache.players.put(p);
        }
        pids.add(p.pid);
    }

    // For watched players not in cache, mark as unwatched an add to cache
    const promises = [];
    await idb.league.players.iterate(p => {
        if (p.watch && typeof p.watch !== "function" && !pids.has(p.pid)) {
            p.watch = false;
            promises.push(idb.cache.players.add(p)); // Can't await here because of Firefox IndexedDB issues
        }
    });
    await Promise.all(promises);
};

const countNegotiations = async () => {
    const negotiations = await idb.cache.negotiations.getAll();
    return negotiations.length;
};

const createLeague = async (
    name: string,
    tid: number,
    leagueFile: Object | void,
    startingSeason: number,
    randomizeRosters: boolean,
    conditions: Conditions,
): Promise<number> => {
    return league.create(
        name,
        tid,
        leagueFile,
        startingSeason,
        randomizeRosters,
        conditions,
    );
};

const deleteOldData = async (options: {
    boxScores: boolean,
    teamStats: boolean,
    teamHistory: boolean,
    retiredPlayersUnnotable: boolean,
    retiredPlayers: boolean,
    playerStatsUnnotable: boolean,
    playerStats: boolean,
}) => {
    await idb.league.tx(
        [
            "draftLotteryResults",
            "games",
            "teams",
            "teamSeasons",
            "teamStats",
            "players",
            "playerStats",
        ],
        "readwrite",
        tx => {
            if (options.boxScores) {
                tx.games.clear();
            }

            if (options.teamHistory) {
                tx.teamSeasons.iterate(teamSeason => {
                    if (teamSeason.season < g.season) {
                        tx.teamSeasons.delete(teamSeason.rid);
                    }
                });
                tx.draftLotteryResults.clear();
            }

            if (options.teamStats) {
                tx.teamStats.iterate(teamStats => {
                    if (teamStats.season < g.season) {
                        tx.teamStats.delete(teamStats.rid);
                    }
                });
            }

            if (options.retiredPlayers) {
                const toDelete = [];

                tx.players.index("tid").iterate(PLAYER.RETIRED, p => {
                    toDelete.push(p.pid);
                    tx.players.delete(p.pid);
                });
                tx.playerStats.iterate(ps => {
                    if (toDelete.includes(ps.pid)) {
                        tx.playerStats.delete(ps.psid);
                    }
                });
            } else if (options.retiredPlayersUnnotable) {
                const toDelete = [];

                tx.players.index("tid").iterate(PLAYER.RETIRED, p => {
                    if (
                        p.awards.length === 0 &&
                        !p.statsTids.includes(g.userTid)
                    ) {
                        toDelete.push(p.pid);
                        tx.players.delete(p.pid);
                    }
                });
                tx.playerStats.iterate(ps => {
                    if (toDelete.includes(ps.pid)) {
                        tx.playerStats.delete(ps.psid);
                    }
                });
            }

            if (options.playerStats) {
                tx.players.iterate(p => {
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    return p;
                });
                tx.playerStats.iterate(ps => {
                    if (ps.season < g.season) {
                        tx.playerStats.delete(ps.psid);
                    }
                });
            } else if (options.playerStatsUnnotable) {
                const toDelete = [];

                tx.players.iterate(p => {
                    if (
                        p.awards.length === 0 &&
                        !p.statsTids.includes(g.userTid)
                    ) {
                        p.ratings = [p.ratings[p.ratings.length - 1]];
                        toDelete.push(p.pid);
                    }
                    return p;
                });
                tx.playerStats.iterate(ps => {
                    if (ps.season < g.season && toDelete.includes(ps.pid)) {
                        tx.playerStats.delete(ps.psid);
                    }
                });
            }
        },
    );
};

const draftLottery = async () => {
    const draftLotteryResult = await draft.genOrder();

    return draftLotteryResult.result;
};

const draftUntilUserOrEnd = async (conditions: Conditions) => {
    await updateStatus("Draft in progress...");

    const pids = await draft.untilUserOrEnd(conditions);
    const draftOrder = await draft.getOrder();

    if (draftOrder.length === 0) {
        await updateStatus("Idle");
    }

    return pids;
};

const draftUser = async (pid: number) => {
    const draftOrder = await draft.getOrder();
    const pick = draftOrder[0];
    if (pick && g.userTids.includes(pick.tid)) {
        draftOrder.shift();
        await draft.selectPlayer(pick, pid);
        await draft.setOrder(draftOrder);
    } else {
        throw new Error("User trying to draft out of turn.");
    }
};

// exportPlayerAveragesCsv(2015) - just 2015 stats
// exportPlayerAveragesCsv("all") - all stats
const exportPlayerAveragesCsv = async (season: number | "all") => {
    let players;
    if (g.season === season && g.phase <= PHASE.PLAYOFFS) {
        players = await idb.cache.players.indexGetAll("playersByTid", [
            PLAYER.FREE_AGENT,
            Infinity,
        ]);
    } else if (season === "all") {
        players = await idb.getCopies.players({ activeAndRetired: true });
    } else {
        players = await idb.getCopies.players({ activeSeason: season });
    }

    // Array of seasons in stats, either just one or all of them
    let seasons;
    if (season === "all") {
        seasons = _.uniq(
            _.flatten(players.map(p => p.ratings)).map(pr => pr.season),
        );
    } else {
        seasons = [season];
    }

    let output =
        "pid,Name,Pos,Age,Team,Season,GP,GS,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-,PER,EWA\n";

    for (const s of seasons) {
        const players2 = await idb.getCopies.playersPlus(players, {
            attrs: ["pid", "name", "age"],
            ratings: ["pos"],
            stats: [
                "abbrev",
                "gp",
                "gs",
                "min",
                "fg",
                "fga",
                "fgp",
                "tp",
                "tpa",
                "tpp",
                "ft",
                "fta",
                "ftp",
                "orb",
                "drb",
                "trb",
                "ast",
                "tov",
                "stl",
                "blk",
                "ba",
                "pf",
                "pts",
                "pm",
                "per",
                "ewa",
            ],
            season: s,
        });

        for (const p of players2) {
            output += `${[
                p.pid,
                p.name,
                p.ratings.pos,
                p.age,
                p.stats.abbrev,
                s,
                p.stats.gp,
                p.stats.gs,
                p.stats.min,
                p.stats.fg,
                p.stats.fga,
                p.stats.fgp,
                p.stats.tp,
                p.stats.tpa,
                p.stats.tpp,
                p.stats.ft,
                p.stats.fta,
                p.stats.ftp,
                p.stats.orb,
                p.stats.drb,
                p.stats.trb,
                p.stats.ast,
                p.stats.tov,
                p.stats.stl,
                p.stats.blk,
                p.stats.ba,
                p.stats.pf,
                p.stats.pts,
                p.stats.pm,
                p.stats.per,
                p.stats.ewa,
            ].join(",")}\n`;
        }
    }

    return output;
};

// exportPlayerGamesCsv(2015) - just 2015 games
// exportPlayerGamesCsv("all") - all games
const exportPlayerGamesCsv = async (season: number | "all") => {
    let games;
    if (season === "all") {
        games = await idb.getCopies.games();
    } else {
        games = await idb.getCopies.games({ season });
    }

    let output =
        "pid,Name,Pos,Team,Opp,Score,WL,Season,Playoffs,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-\n";

    const teams = games.map(gm => gm.teams);
    const seasons = games.map(gm => gm.season);
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < 2; j++) {
            const t = teams[i][j];
            const t2 = teams[i][j === 0 ? 1 : 0];
            for (const p of t.players) {
                output += `${[
                    p.pid,
                    p.name,
                    p.pos,
                    g.teamAbbrevsCache[t.tid],
                    g.teamAbbrevsCache[t2.tid],
                    `${t.pts}-${t2.pts}`,
                    t.pts > t2.pts ? "W" : "L",
                    seasons[i],
                    games[i].playoffs,
                    p.min,
                    p.fg,
                    p.fga,
                    p.fgp,
                    p.tp,
                    p.tpa,
                    p.tpp,
                    p.ft,
                    p.fta,
                    p.ftp,
                    p.orb,
                    p.drb,
                    p.trb,
                    p.ast,
                    p.tov,
                    p.stl,
                    p.blk,
                    p.ba,
                    p.pf,
                    p.pts,
                    p.pm,
                ].join(",")}\n`;
            }
        }
    }

    return output;
};

const exportLeague = async (stores: string[]) => {
    return league.exportLeague(stores);
};

const getLeagueName = async (lid: number) => {
    const l = await idb.meta.leagues.get(lid);
    return l.name;
};

const getLocal = async (name: $Keys<Local>): any => {
    return local[name];
};

const getTradingBlockOffers = async (pids: number[], dpids: number[]) => {
    const getOffers = async (userPids, userDpids) => {
        // Pick 10 random teams to try (or all teams, if g.numTeams < 10)
        const tids = _.range(g.numTeams);
        random.shuffle(tids);
        tids.splice(10);

        const estValues = await trade.getPickValues();

        const offers = [];
        for (const tid of tids) {
            let teams = [
                {
                    tid: g.userTid,
                    pids: userPids,
                    dpids: userDpids,
                },
                {
                    tid,
                    pids: [],
                    dpids: [],
                },
            ];

            if (tid !== g.userTid) {
                teams = await trade.makeItWork(teams, true, estValues);

                if (teams !== undefined) {
                    const summary = await trade.summary(teams);
                    teams[1].warning = summary.warning;
                    offers.push(teams[1]);
                }
            }
        }

        return offers;
    };

    const augmentOffers = async offers => {
        if (offers.length === 0) {
            return [];
        }

        const teams = await idb.getCopies.teamsPlus({
            attrs: ["abbrev", "region", "name", "strategy"],
            seasonAttrs: ["won", "lost"],
            season: g.season,
        });

        // Take the pids and dpids in each offer and get the info needed to display the offer
        return Promise.all(
            offers.map(async (offer, i) => {
                const tid = offers[i].tid;

                let players = await idb.cache.players.indexGetAll(
                    "playersByTid",
                    tid,
                );
                players = players.filter(p => offers[i].pids.includes(p.pid));
                players = await idb.getCopies.playersPlus(players, {
                    attrs: [
                        "pid",
                        "name",
                        "age",
                        "contract",
                        "injury",
                        "watch",
                    ],
                    ratings: ["ovr", "pot", "skills", "pos"],
                    stats: ["min", "pts", "trb", "ast", "per"],
                    season: g.season,
                    tid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true,
                });

                let picks: any = await idb.cache.draftPicks.indexGetAll(
                    "draftPicksByTid",
                    tid,
                );
                picks = helpers.deepCopy(
                    picks.filter(dp => offers[i].dpids.includes(dp.dpid)),
                );
                for (const pick of picks) {
                    pick.desc = helpers.pickDesc(pick);
                }

                const payroll = (await team.getPayroll(tid))[0];

                return {
                    tid,
                    abbrev: teams[tid].abbrev,
                    region: teams[tid].region,
                    name: teams[tid].name,
                    strategy: teams[tid].strategy,
                    won: teams[tid].seasonAttrs.won,
                    lost: teams[tid].seasonAttrs.lost,
                    pids: offers[i].pids,
                    dpids: offers[i].dpids,
                    warning: offers[i].warning,
                    payroll,
                    picks,
                    players,
                };
            }),
        );
    };

    const offers = await getOffers(pids, dpids);

    return augmentOffers(offers);
};

const handleUploadedDraftClass = async (
    uploadedFile: any,
    seasonOffset: 0 | 1 | 2,
) => {
    // What tid to replace?
    let draftClassTid;
    if (seasonOffset === 0) {
        draftClassTid = PLAYER.UNDRAFTED;
    } else if (seasonOffset === 1) {
        draftClassTid = PLAYER.UNDRAFTED_2;
    } else if (seasonOffset === 2) {
        draftClassTid = PLAYER.UNDRAFTED_3;
    } else {
        throw new Error("Invalid draft class index");
    }

    // Get all players from uploaded files
    let players = uploadedFile.players;

    // Filter out any that are not draft prospects
    players = players.filter(p => p.tid === PLAYER.UNDRAFTED);

    // Get scouting rank, which is used in a couple places below
    const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
        "teamSeasonsByTidSeason",
        [`${g.userTid},${g.season - 2}`, `${g.userTid},${g.season}`],
    );
    const scoutingRank = finances.getRankLastThree(
        teamSeasons,
        "expenses",
        "scouting",
    );

    // Delete old players from draft class
    const oldPlayers = await idb.cache.players.indexGetAll(
        "playersByTid",
        draftClassTid,
    );
    for (const p of oldPlayers) {
        await idb.cache.players.delete(p.pid);
    }

    // Find season from uploaded file, for age adjusting
    let uploadedSeason;
    if (uploadedFile.hasOwnProperty("gameAttributes")) {
        for (let i = 0; i < uploadedFile.gameAttributes.length; i++) {
            if (uploadedFile.gameAttributes[i].key === "season") {
                uploadedSeason = uploadedFile.gameAttributes[i].value;
                break;
            }
        }
    } else if (uploadedFile.hasOwnProperty("startingSeason")) {
        uploadedSeason = uploadedFile.startingSeason;
    }

    let seasonOffset2 = seasonOffset;
    if (g.phase >= PHASE.FREE_AGENCY) {
        // Already generated next year's draft, so bump up one
        seasonOffset2 += 1;
    }

    const draftYear = g.season + seasonOffset2;

    // Add new players to database
    await Promise.all(
        players.map(async p => {
            // Make sure player object is fully defined
            p = player.augmentPartialPlayer(
                p,
                scoutingRank,
                uploadedFile.version,
            );

            // Manually set TID, since at this point it is always PLAYER.UNDRAFTED
            p.tid = draftClassTid;

            // Manually remove PID, since all it can do is cause trouble
            if (p.hasOwnProperty("pid")) {
                delete p.pid;
            }

            // Adjust age
            if (uploadedSeason !== undefined) {
                p.born.year += g.season - uploadedSeason + seasonOffset2;
            }

            // Adjust seasons
            p.ratings[0].season = draftYear;
            p.draft.year = draftYear;

            // Don't want lingering stats vector in player objects, and draft prospects don't have any stats
            delete p.stats;

            await player.updateValues(p);
            await idb.cache.players.add(p);
        }),
    );

    // "Top off" the draft class if <70 players imported
    if (players.length < 70) {
        await draft.genPlayers(
            draftClassTid,
            scoutingRank,
            70 - players.length,
        );
    }
};

const init = async (inputEnv: Env, conditions: Conditions) => {
    Object.assign(env, inputEnv);

    // Kind of hacky, only run this for the first host tab
    if (idb.meta === undefined) {
        checkNaNs();

        idb.meta = await connectMeta(inputEnv.fromLocalStorage);

        // Account and changes checks can be async
        changes.check(conditions);
        account.check(conditions);
    }
};

const lockSet = async (name: LockName, value: boolean) => {
    lock.set(name, value);
};

const ratingsStatsPopoverInfo = async (pid: number) => {
    const p = await idb.getCopy.players({ pid });
    if (p === undefined) {
        throw new Error(`Invalid player ID ${pid}`);
    }

    // For draft prospects, show their draft season, otherwise they will be skipped due to not having ratings in g.season
    const season = p.draft.year > g.season ? p.draft.year : g.season;

    return idb.getCopy.playersPlus(p, {
        ratings: [
            "ovr",
            "pot",
            "hgt",
            "stre",
            "spd",
            "jmp",
            "endu",
            "ins",
            "dnk",
            "ft",
            "fg",
            "tp",
            "blk",
            "stl",
            "drb",
            "pss",
            "reb",
        ],
        stats: ["pts", "trb", "ast", "blk", "stl", "tov", "min", "per", "ewa"],
        season,
        showNoStats: true,
        oldStats: true,
        fuzz: true,
    });
};

const releasePlayer = async (pid: number, justDrafted: boolean) => {
    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        g.userTid,
    );
    if (players.length <= 5) {
        return "You must keep at least 5 players on your roster.";
    }

    const p = await idb.cache.players.get(pid);

    // Don't let the user update CPU-controlled rosters
    if (p.tid !== g.userTid) {
        return "You aren't allowed to do this.";
    }

    await player.release(p, justDrafted);
};

const removeLeague = async (lid: number) => {
    await league.remove(lid);
};

const reorderRosterDrag = async (sortedPids: number[]) => {
    await Promise.all(
        sortedPids.map(async (pid, rosterOrder) => {
            const p = await idb.cache.players.get(pid);
            if (p.rosterOrder !== rosterOrder) {
                p.rosterOrder = rosterOrder;
                await idb.cache.players.put(p);
            }
        }),
    );
};

const runBefore = async (
    viewId: string,
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    prevData: any,
    conditions: Conditions,
): Promise<(void | { [key: string]: any })[]> => {
    if (
        views.hasOwnProperty(viewId) &&
        views[viewId].hasOwnProperty("runBefore")
    ) {
        return Promise.all(
            views[viewId].runBefore.map(fn => {
                return fn(inputs, updateEvents, prevData, conditions);
            }),
        );
    }

    return [];
};

const startFantasyDraft = async (
    position: number | "random",
    conditions: Conditions,
) => {
    await phase.newPhase(PHASE.FANTASY_DRAFT, conditions, position);
};

const switchTeam = async (tid: number) => {
    await updateStatus("Idle");
    updatePlayMenu();

    await league.setGameAttributes({
        gameOver: false,
        userTid: tid,
        userTids: [tid],
        ownerMood: {
            wins: 0,
            playoffs: 0,
            money: 0,
        },
        gracePeriodEnd: g.season + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
    });
    league.updateMetaNameRegion(
        g.teamNamesCache[g.userTid],
        g.teamRegionsCache[g.userTid],
    );
};

const updateBudget = async (budgetAmounts: {
    coaching: number,
    facilities: number,
    health: number,
    scouting: number,
    ticketPrice: number,
}) => {
    const t = await idb.cache.teams.get(g.userTid);

    for (const key of Object.keys(budgetAmounts)) {
        // Check for NaN before updating
        // eslint-disable-next-line no-self-compare
        if (budgetAmounts[key] === budgetAmounts[key]) {
            t.budget[key].amount = budgetAmounts[key];
        }
    }

    await idb.cache.teams.put(t);

    await finances.updateRanks(["budget"]);
};

const updateGameAttributes = async (gameAttributes: GameAttributes) => {
    await league.setGameAttributes(gameAttributes);
};

const updateMultiTeamMode = async (gameAttributes: {
    userTids: number[],
    userTid?: number,
}) => {
    await league.setGameAttributes(gameAttributes);

    if (gameAttributes.userTids.length === 1) {
        league.updateMetaNameRegion(
            g.teamNamesCache[gameAttributes.userTids[0]],
            g.teamRegionsCache[gameAttributes.userTids[0]],
        );
    } else {
        league.updateMetaNameRegion("Multi Team Mode", "");
    }
};

const updatePlayerWatch = async (pid: number, watch: boolean) => {
    const cachedPlayer = await idb.cache.players.get(pid);
    if (cachedPlayer) {
        cachedPlayer.watch = watch;
        await idb.cache.players.put(cachedPlayer);
    } else {
        const p = await idb.league.players.get(pid);
        p.watch = watch;
        await idb.cache.players.add(p);
    }
};

const updatePlayingTime = async (pid: number, ptModifier: number) => {
    const p = await idb.cache.players.get(pid);
    p.ptModifier = ptModifier;
    await idb.cache.players.put(p);
};

const updateTeamInfo = async (
    newTeams: {
        cid?: number,
        did?: number,
        region: string,
        name: string,
        abbrev: string,
        imgURL?: string,
        pop: number,
    }[],
) => {
    let userName;
    let userRegion;

    const teams = await idb.cache.teams.getAll();
    for (const t of teams) {
        if (
            newTeams[t.tid].hasOwnProperty("cid") &&
            typeof newTeams[t.tid].cid === "number"
        ) {
            t.cid = newTeams[t.tid].cid;
        }
        if (
            newTeams[t.tid].hasOwnProperty("did") &&
            typeof newTeams[t.tid].did === "number"
        ) {
            t.did = newTeams[t.tid].did;
        }
        t.region = newTeams[t.tid].region;
        t.name = newTeams[t.tid].name;
        t.abbrev = newTeams[t.tid].abbrev;
        if (newTeams[t.tid].hasOwnProperty("imgURL")) {
            t.imgURL = newTeams[t.tid].imgURL;
        }

        await idb.cache.teams.put(t);

        if (t.tid === g.userTid) {
            userName = t.name;
            userRegion = t.region;
        }

        const teamSeason = await idb.cache.teamSeasons.indexGet(
            "teamSeasonsByTidSeason",
            `${t.tid},${g.season}`,
        );
        teamSeason.pop = parseFloat(newTeams[t.tid].pop);
        await idb.cache.teamSeasons.put(teamSeason);
    }

    await league.updateMetaNameRegion(userName, userRegion);

    await league.setGameAttributes({
        teamAbbrevsCache: newTeams.map(t => t.abbrev),
        teamRegionsCache: newTeams.map(t => t.region),
        teamNamesCache: newTeams.map(t => t.name),
    });
};

const upsertCustomizedPlayer = async (
    p: Player | PlayerWithoutPid,
    originalTid: number,
    season: number,
): Promise<number> => {
    const r = p.ratings.length - 1;

    // Fix draft season
    if (
        p.tid === PLAYER.UNDRAFTED ||
        p.tid === PLAYER.UNDRAFTED_2 ||
        p.tid === PLAYER.UNDRAFTED_3
    ) {
        if (p.tid === PLAYER.UNDRAFTED) {
            p.draft.year = season;
        } else if (p.tid === PLAYER.UNDRAFTED_2) {
            p.draft.year = season + 1;
        } else if (p.tid === PLAYER.UNDRAFTED_3) {
            p.draft.year = season + 2;
        }

        // Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
        if (g.phase >= PHASE.FREE_AGENCY) {
            p.draft.year += 1;
        }

        p.ratings[r].season = p.draft.year;
    }

    // Set ovr, skills, and bound pot by ovr
    p.ratings[r].ovr = player.ovr(p.ratings[r]);
    p.ratings[r].skills = player.skills(p.ratings[r]);
    if (p.ratings[r].ovr > p.ratings[r].pot) {
        p.ratings[r].pot = p.ratings[r].ovr;
    }

    // If player was retired, add ratings (but don't develop, because that would change ratings)
    if (originalTid === PLAYER.RETIRED) {
        if (g.season - p.ratings[r].season > 0) {
            player.addRatingsRow(p, 15);
        }
    }

    // If we are *creating* a player who is not a draft prospect, make sure he won't show up in the draft this year
    if (
        p.tid !== PLAYER.UNDRAFTED &&
        p.tid !== PLAYER.UNDRAFTED_2 &&
        p.tid !== PLAYER.UNDRAFTED_3 &&
        g.phase < PHASE.FREE_AGENCY
    ) {
        // This makes sure it's only for created players, not edited players
        if (!p.hasOwnProperty("pid")) {
            p.draft.year = g.season - 1;
        }
    }
    // Similarly, if we are editing a draft prospect and moving him to a team, make his draft year in the past
    if (
        p.tid !== PLAYER.UNDRAFTED &&
        p.tid !== PLAYER.UNDRAFTED_2 &&
        p.tid !== PLAYER.UNDRAFTED_3 &&
        (originalTid === PLAYER.UNDRAFTED ||
            originalTid === PLAYER.UNDRAFTED_2 ||
            originalTid === PLAYER.UNDRAFTED_3) &&
        g.phase < PHASE.FREE_AGENCY
    ) {
        p.draft.year = g.season - 1;
    }

    // Recalculate player values, since ratings may have changed
    await player.updateValues(p);

    // Save to database, adding pid if it doesn't already exist
    await idb.cache.players.put(p);

    // Add regular season or playoffs stat row, if necessary
    if (p.tid >= 0 && p.tid !== originalTid && g.phase <= PHASE.PLAYOFFS) {
        // If it is the playoffs, this is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
        await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
    }

    if (typeof p.pid !== "number") {
        throw new Error("Unknown pid");
    }

    return p.pid;
};

const clearTrade = async () => {
    await trade.clear();
};

const createTrade = async (
    teams: [
        {
            tid: number,
            pids: number[],
            dpids: number[],
        },
        {
            tid: number,
            pids: number[],
            dpids: number[],
        },
    ],
) => {
    await trade.create(teams);
};

const proposeTrade = async (
    forceTrade: boolean,
): Promise<[boolean, ?string]> => {
    const output = await trade.propose(forceTrade);
    return output;
};

const tradeCounterOffer = async (): Promise<string> => {
    const message = await trade.makeItWorkTrade();
    return message;
};

const updateTrade = async (
    teams: [
        {
            tid: number,
            pids: number[],
            dpids: number[],
        },
        {
            tid: number,
            pids: number[],
            dpids: number[],
        },
    ],
) => {
    await trade.updatePlayers(teams);
};

export default {
    actions,
    acceptContractNegotiation,
    autoSortRoster,
    beforeViewLeague,
    beforeViewNonLeague,
    cancelContractNegotiation,
    checkParticipationAchievement,
    clearTrade,
    clearWatchList,
    countNegotiations,
    createLeague,
    createTrade,
    deleteOldData,
    draftLottery,
    draftUntilUserOrEnd,
    draftUser,
    exportLeague,
    exportPlayerAveragesCsv,
    exportPlayerGamesCsv,
    getLeagueName,
    getLocal,
    getTradingBlockOffers,
    handleUploadedDraftClass,
    init,
    lockSet,
    proposeTrade,
    ratingsStatsPopoverInfo,
    releasePlayer,
    removeLeague,
    reorderRosterDrag,
    runBefore,
    startFantasyDraft,
    switchTeam,
    tradeCounterOffer,
    updateBudget,
    updateGameAttributes,
    updateMultiTeamMode,
    updatePlayerWatch,
    updatePlayingTime,
    updateTeamInfo,
    updateTrade,
    upsertCustomizedPlayer,
};
