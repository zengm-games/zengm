// @flow

import backboard from 'backboard';
import Promise from 'bluebird';
import _ from 'underscore';
import {PHASE, PLAYER} from '../common';
import g from '../globals';
import * as helpers from '../util/helpers';
import {account, beforeView, random, updatePlayMenu, updateStatus} from '../worker/util';
import {init, views} from '../worker';
import {contractNegotiation, draft, finances, league, phase, player, team, trade} from '../worker/core';
import {getCopy} from '../worker/db';
import type {GameAttributes, GetOutput, PageCtx, Player, PlayerWithoutPid, UpdateEvents} from '../common/types';

const acceptContractNegotiation = async (pid: number, amount: number, exp: number): Promise<?string> => {
    return contractNegotiation.accept(pid, amount, exp);
};

const autoSortRoster = async () => {
    await team.rosterAutoSort(g.userTid);
    league.updateLastDbChange();
};

const beforeViewLeague = async (ctx: PageCtx, lid: ?number) => {
    return beforeView.league(ctx, lid);
};

const beforeViewNonLeague = async (ctx: PageCtx) => {
    return beforeView.nonLeague(ctx);
};

const cancelContractNegotiation = async (pid: number) => {
    return contractNegotiation.cancel(pid);
};

const checkAccount = async () => {
    await account.check();
};

const checkParticipationAchievevment = async (force: boolean = false) => {
    if (force) {
        await account.addAchievements(['participation']);
    } else {
        const achievements = await account.getAchievements();
        if (achievements[0].count === 0) {
            await account.addAchievements(['participation']);
        }
    }
};

const clearWatchList = async (): Promise<string> => {
    const players = await g.cache.getAll('players');
    for (const p of players) {
        if (p.watch) {
            p.watch = false;
        }
    }

    await g.dbl.tx("players", "readwrite", tx => {
        return tx.players.iterate(p => {
            if (p.watch) {
                p.watch = false;
                return p;
            }
        });
    });

    league.updateLastDbChange();
};

const countNegotiations = async () => {
    const negotiations = await g.cache.getAll('negotiations');
    return negotiations.length;
};

const createLeague = async (
    name: string,
    tid: number,
    leagueFile: Object = {},
    startingSeason: number,
    randomizeRosters: boolean,
): Promise<number> => {
    return league.create(name, tid, leagueFile, startingSeason, randomizeRosters);
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
    await g.dbl.tx(["games", "teams", "teamSeasons", "teamStats", "players", "playerStats"], "readwrite", async tx => {
        if (options.boxScores) {
            await tx.games.clear();
        }

        if (options.teamHistory) {
            await tx.teamSeasons.iterate(teamSeason => {
                if (teamSeason.season < g.season) {
                    return tx.teamSeasons.delete(teamSeason.rid);
                }
            });
        }

        if (options.teamStats) {
            await tx.teamStats.iterate(teamStats => {
                if (teamStats.season < g.season) {
                    return tx.teamStats.delete(teamStats.rid);
                }
            });
        }

        if (options.retiredPlayers) {
            const toDelete = [];

            await tx.players.index('tid').iterate(PLAYER.RETIRED, p => {
                toDelete.push(p.pid);
                return tx.players.delete(p.pid);
            });
            await tx.playerStats.iterate(ps => {
                if (toDelete.includes(ps.pid)) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        } else if (options.retiredPlayersUnnotable) {
            const toDelete = [];

            await tx.players.index('tid').iterate(PLAYER.RETIRED, p => {
                if (p.awards.length === 0 && !p.statsTids.includes(g.userTid)) {
                    toDelete.push(p.pid);
                    return tx.players.delete(p.pid);
                }
            });
            await tx.playerStats.iterate(ps => {
                if (toDelete.includes(ps.pid)) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        }

        if (options.playerStats) {
            await tx.players.iterate(p => {
                p.ratings = [p.ratings[p.ratings.length - 1]];
                return p;
            });
            await tx.playerStats.iterate(ps => {
                if (ps.season < g.season) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        } else if (options.playerStatsUnnotable) {
            const toDelete = [];

            tx.players.iterate(p => {
                if (p.awards.length === 0 && !p.statsTids.includes(g.userTid)) {
                    p.ratings = [p.ratings[p.ratings.length - 1]];
                    toDelete.push(p.pid);
                }
                return p;
            });
            await tx.playerStats.iterate(ps => {
                if (ps.season < g.season && toDelete.includes(ps.pid)) {
                    return tx.playerStats.delete(ps.psid);
                }
            });
        }
    });

    league.updateLastDbChange();
};

const draftUntilUserOrEnd = async () => {
    updateStatus('Draft in progress...');

    const pids = await draft.untilUserOrEnd();
    const draftOrder = await draft.getOrder();

    league.updateLastDbChange();

    if (draftOrder.length === 0) {
        updateStatus("Idle");
    }

    return pids;
};

const draftUser = async (pid: number) => {
    const draftOrder = await draft.getOrder();
    const pick = draftOrder.shift();
    if (pick && g.userTids.includes(pick.tid)) {
        await draft.selectPlayer(pick, pid);
    } else {
        throw new Error('User trying to draft out of turn.');
    }
};

// exportPlayerAveragesCsv(2015) - just 2015 stats
// exportPlayerAveragesCsv("all") - all stats
const exportPlayerAveragesCsv = async (season: number | 'all') => {
    let players;
    if (g.season === season && g.phase <= PHASE.PLAYOFFS) {
        players = await g.cache.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]);
    } else {
        // If it's not this season, get all players, because retired players could apply to the selected season
        players = await getCopy.players({activeAndRetired: true});
    }

    // Array of seasons in stats, either just one or all of them
    let seasons;
    if (season === 'all') {
        seasons = _.uniq(_.flatten(players.map(p => p.ratings)).map(pr => pr.season));
    } else {
        seasons = [season];
    }

    let output = "pid,Name,Pos,Age,Team,Season,GP,GS,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-,PER,EWA\n";

    for (const s of seasons) {
        const players2 = await getCopy.playersPlus(players, {
            attrs: ["pid", "name", "age"],
            ratings: ["pos"],
            stats: ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm", "per", "ewa"],
            season: s,
        });

        for (const p of players2) {
            output += `${[p.pid, p.name, p.ratings.pos, p.age, p.stats.abbrev, s, p.stats.gp, p.stats.gs, p.stats.min, p.stats.fg, p.stats.fga, p.stats.fgp, p.stats.tp, p.stats.tpa, p.stats.tpp, p.stats.ft, p.stats.fta, p.stats.ftp, p.stats.orb, p.stats.drb, p.stats.trb, p.stats.ast, p.stats.tov, p.stats.stl, p.stats.blk, p.stats.ba, p.stats.pf, p.stats.pts, p.stats.pm, p.stats.per, p.stats.ewa].join(",")}\n`;
        }
    }

    return output;
};

// exportPlayerGamesCsv(2015) - just 2015 games
// exportPlayerGamesCsv("all") - all games
const exportPlayerGamesCsv = async (season: number | 'all') => {
    let games;
    if (season === "all") {
        games = await g.dbl.games.getAll();
    } else {
        games = await g.dbl.games.index('season').getAll(season);
    }

    let output = "pid,Name,Pos,Team,Opp,Score,WL,Season,Playoffs,Min,FGM,FGA,FG%,3PM,3PA,3P%,FTM,FTA,FT%,OReb,DReb,Reb,Ast,TO,Stl,Blk,BA,PF,Pts,+/-\n";

    const teams = games.map(gm => gm.teams);
    const seasons = games.map(gm => gm.season);
    for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < 2; j++) {
            const t = teams[i][j];
            const t2 = teams[i][j === 0 ? 1 : 0];
            for (const p of t.players) {
                output += `${[p.pid, p.name, p.pos, g.teamAbbrevsCache[t.tid], g.teamAbbrevsCache[t2.tid], `${t.pts}-${t2.pts}`, t.pts > t2.pts ? "W" : "L", seasons[i], games[i].playoffs, p.min, p.fg, p.fga, p.fgp, p.tp, p.tpa, p.tpp, p.ft, p.fta, p.ftp, p.orb, p.drb, p.trb, p.ast, p.tov, p.stl, p.blk, p.ba, p.pf, p.pts, p.pm].join(",")}\n`;
            }
        }
    }

    return output;
};

const exportLeague = async (stores: string[]) => {
    return league.exportLeague(stores);
};

const getLeagueName = async (lid: number) => {
    const l = await g.dbm.leagues.get(lid);
    return l.name;
};

const getTradingBlockOffers = async (pids: number[], dpids: number[], progressCallback: (i: number, numTeams: number) => void) => {
    const getOffers = async (userPids, userDpids, onProgress) => {
        // Pick 10 random teams to try (or all teams, if g.numTeams < 10)
        const tids = _.range(g.numTeams);
        random.shuffle(tids);
        tids.splice(10);

        const estValues = await trade.getPickValues();

        // For width of progress bar
        let numTeams = tids.length;
        if (tids.includes(g.userTid)) {
            numTeams -= 1;
        }
        let done = 0;

        const offers = [];
        for (const tid of tids) {
            let teams = [{
                tid: g.userTid,
                pids: userPids,
                dpids: userDpids,
            }, {
                tid,
                pids: [],
                dpids: [],
            }];

            if (tid !== g.userTid) {
                const [found, teams2] = await trade.makeItWork(teams, true, estValues);
                teams = teams2;

                // Update progress bar
                done += 1;
                onProgress(done, numTeams);

                if (found) {
                    const summary = await trade.summary(teams);
                    teams[1].warning = summary.warning;
                    offers.push(teams[1]);
                }
            }
        }

        return offers;
    };

    const augmentOffers = async (offers) => {
        if (offers.length === 0) {
            return [];
        }

        const teams = await getCopy.teams({
            attrs: ["abbrev", "region", "name", "strategy"],
            seasonAttrs: ["won", "lost"],
            season: g.season,
        });

        // Take the pids and dpids in each offer and get the info needed to display the offer
        return Promise.all(offers.map(async (offer, i) => {
            const tid = offers[i].tid;

            let players = await g.cache.indexGetAll('playersByTid', tid);
            players = players.filter(p => offers[i].pids.includes(p.pid));
            players = await getCopy.playersPlus(players, {
                attrs: ["pid", "name", "age", "contract", "injury", "watch"],
                ratings: ["ovr", "pot", "skills", "pos"],
                stats: ["min", "pts", "trb", "ast", "per"],
                season: g.season,
                tid,
                showNoStats: true,
                showRookies: true,
                fuzz: true,
            });

            let picks = await g.cache.indexGetAll('draftPicksByTid', tid);
            picks = helpers.deepCopy(picks.filter(dp => offers[i].dpids.includes(dp.dpid)));
            for (const pick of picks) {
                pick.desc = helpers.pickDesc(pick);
            }

            const payroll = await team.getPayroll(tid).get(0);

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
        }));
    };

    const offers = await getOffers(pids, dpids, progressCallback);

    return augmentOffers(offers);
};

const handleUploadedDraftClass = async (uploadedFile: any, seasonOffset: 0 | 1 | 2) => {
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
    const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([g.userTid, g.season - 2], [g.userTid, g.season]));

    const scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

    // Delete old players from draft class
    await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
        await tx.players.index('tid').iterate(draftClassTid, p => tx.players.delete(p.pid));

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
        await Promise.all(players.map(async (p) => {
            // Make sure player object is fully defined
            p = player.augmentPartialPlayer(p, scoutingRank);

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
            await tx.players.put(p);
        }));

        // "Top off" the draft class if <70 players imported
        if (players.length < 70) {
            await draft.genPlayers(draftClassTid, scoutingRank, 70 - players.length);
        }
    });
};

const releasePlayer = async (pid: number, justDrafted: boolean) => {
    const players = await g.cache.indexGetAll('playersByTid', g.userTid);
    if (players.length <= 5) {
        return 'You must keep at least 5 players on your roster.';
    }

    const p = await g.cache.get('players', pid);

    // Don't let the user update CPU-controlled rosters
    if (p.tid !== g.userTid) {
        return "You aren't allowed to do this.";
    }

    await player.release(p, justDrafted);
    league.updateLastDbChange();
};

const removeLeague = async (lid: number) => {
    await league.remove(lid);
};

const reorderRosterDrag = async (sortedPids: number[]) => {
    await Promise.all(sortedPids.map(async (pid, rosterOrder) => {
        const p = await g.cache.get('players', pid);
        if (p.rosterOrder !== rosterOrder) {
            p.rosterOrder = rosterOrder;
        }
    }));
    league.updateLastDbChange();
};

const reorderRosterSwap = async (sortedPlayers: {pid: number}[], pid1: number, pid2: number) => {
    const rosterOrder1 = sortedPlayers.findIndex(p => p.pid === pid1);
    const rosterOrder2 = sortedPlayers.findIndex(p => p.pid === pid2);

    await Promise.all(sortedPlayers.map(async (sortedPlayer, i) => {
        const pid = sortedPlayers[i].pid;
        const p = await g.cache.get('players', pid);
        let rosterOrder = i;
        if (pid === pid1) {
            rosterOrder = rosterOrder2;
        } else if (pid === pid2) {
            rosterOrder = rosterOrder1;
        }

        if (p.rosterOrder !== rosterOrder) {
            p.rosterOrder = rosterOrder;
        }
    }));

    league.updateLastDbChange();
};

const runBefore = async (
    viewId: string,
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    prevData: any,
    setStateData: (state: any) => void,
    topMenu: any,
): Promise<(void | {[key: string]: any})[]> => {
    if (views.hasOwnProperty(viewId) && views[viewId].hasOwnProperty('runBefore')) {
        return Promise.all(views[viewId].runBefore.map((fn) => {
            return fn(inputs, updateEvents, prevData, setStateData, topMenu);
        }));
    }

    return [];
};

const startFantasyDraft = async (position: number | 'random') => {
    await phase.newPhase(PHASE.FANTASY_DRAFT, position);
};

const switchTeam = async (tid: number) => {
    updateStatus("Idle");
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

    league.updateLastDbChange();
    league.updateMetaNameRegion(g.teamNamesCache[g.userTid], g.teamRegionsCache[g.userTid]);
};

const updateBudget = async (budgetAmounts: {
    coaching: number,
    facilities: number,
    health: number,
    scouting: number,
    ticketPrice: number,
}) => {
    const t = await g.cache.get('teams', g.userTid);

    for (const key of Object.keys(budgetAmounts)) {
        // Check for NaN before updating
        if (budgetAmounts[key] === budgetAmounts[key]) {
            t.budget[key].amount = budgetAmounts[key];
        }
    }

    await finances.updateRanks(["budget"]);

    league.updateLastDbChange();
};

const updateGameAttributes = async (gameAttributes: GameAttributes, updateLastDbChange: boolean = true) => {
    await league.setGameAttributes(gameAttributes);

    if (updateLastDbChange) {
        league.updateLastDbChange();
    }
};

const updateMultiTeamMode = async (gameAttributes: {userTids: number[], userTid?: number}) => {
    await league.setGameAttributes(gameAttributes);

    if (gameAttributes.userTids.length === 1) {
        league.updateMetaNameRegion(g.teamNamesCache[gameAttributes.userTids[0]], g.teamRegionsCache[gameAttributes.userTids[0]]);
    } else {
        league.updateMetaNameRegion('Multi Team Mode', '');
    }

    league.updateLastDbChange();
};

const updatePlayerWatch = async (pid: number, watch: boolean) => {
    const cachedPlayer = await g.cache.get('players', pid);
    if (cachedPlayer) {
        cachedPlayer.watch = watch;
    } else {
        await g.dbl.tx('players', 'readwrite', async tx => {
            const p = await tx.players.get(pid);
            p.watch = watch;
            await tx.players.put(p);
        });
    }

    league.updateLastDbChange();
};

const updatePlayingTime = async (pid: number, ptModifier: number) => {
    const p = await g.cache.get('players', pid);
    p.ptModifier = ptModifier;
    league.updateLastDbChange();
};

const updateTeamInfo = async (newTeams: {
    cid?: number,
    did?: number,
    region: string,
    name: string,
    abbrev: string,
    imgURL?: string,
    pop: number,
}[]) => {
    let userName;
    let userRegion;
    await g.dbl.tx(['teams', 'teamSeasons'], 'readwrite', tx => {
        return tx.teams.iterate(async t => {
            if (newTeams[t.tid].hasOwnProperty('cid')) {
                t.cid = newTeams[t.tid].cid;
            }
            if (newTeams[t.tid].hasOwnProperty('did')) {
                t.did = newTeams[t.tid].did;
            }
            t.region = newTeams[t.tid].region;
            t.name = newTeams[t.tid].name;
            t.abbrev = newTeams[t.tid].abbrev;
            if (newTeams[t.tid].hasOwnProperty('imgURL')) {
                t.imgURL = newTeams[t.tid].imgURL;
            }

            if (t.tid === g.userTid) {
                userName = t.name;
                userRegion = t.region;
            }

            const teamSeason = await tx.teamSeasons.index('season, tid').get([g.season, t.tid]);
            teamSeason.pop = parseFloat(newTeams[t.tid].pop);
            await tx.teamSeasons.put(teamSeason);

            return t;
        });
    });

    await league.updateMetaNameRegion(userName, userRegion);

    await league.setGameAttributes({
        teamAbbrevsCache: newTeams.map(t => t.abbrev),
        teamRegionsCache: newTeams.map(t => t.region),
        teamNamesCache: newTeams.map(t => t.name),
    });

    league.updateLastDbChange();
};

const upsertCustomizedPlayer = async (p: Player | PlayerWithoutPid, originalTid: number, season: number): Promise<number> => {
    const r = p.ratings.length - 1;

    // Fix draft season
    if (p.tid === PLAYER.UNDRAFTED || p.tid === PLAYER.UNDRAFTED_2 || p.tid === PLAYER.UNDRAFTED_3) {
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
    if (p.tid !== PLAYER.UNDRAFTED && p.tid !== PLAYER.UNDRAFTED_2 && p.tid !== PLAYER.UNDRAFTED_3 && g.phase < PHASE.FREE_AGENCY) {
        // This makes sure it's only for created players, not edited players
        if (!p.hasOwnProperty("pid")) {
            p.draft.year = g.season - 1;
        }
    }
    // Similarly, if we are editing a draft prospect and moving him to a team, make his draft year in the past
    if ((p.tid !== PLAYER.UNDRAFTED && p.tid !== PLAYER.UNDRAFTED_2 && p.tid !== PLAYER.UNDRAFTED_3) && (originalTid === PLAYER.UNDRAFTED || originalTid === PLAYER.UNDRAFTED_2 || originalTid === PLAYER.UNDRAFTED_3) && g.phase < PHASE.FREE_AGENCY) {
        p.draft.year = g.season - 1;
    }

    // Recalculate player values, since ratings may have changed
    await player.updateValues(p);
    let pid;
    await g.dbl.tx(["players", "playerStats"], "readwrite", async tx => {
        // Get pid (primary key) after add, but can't redirect to player page until transaction completes or else it's a race condition
        // When adding a player, this is the only way to know the pid
        pid = await tx.players.put(p);

        // Add regular season or playoffs stat row, if necessary
        if (p.tid >= 0 && p.tid !== originalTid && g.phase <= PHASE.PLAYOFFS) {
            p.pid = pid;

            // If it is the playoffs, this is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
            await player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);

            // Add back to database
            await tx.players.put(p);
        }
    });

    league.updateLastDbChange();

    return pid;
};

const clearTrade = async () => {
    await trade.clear();
    league.updateLastDbChange();
};

const createTrade = async (teams: [{
    tid: number,
    pids: number[],
    dpids: number[],
}, {
    tid: number,
    pids: number[],
    dpids: number[],
}]) => {
    await trade.create(teams);
    league.updateLastDbChange();
};

const proposeTrade = async (forceTrade: boolean): Promise<[boolean, ?string]> => {
    const output = await trade.propose(forceTrade);
    league.updateLastDbChange();
    return output;
};

const tradeCounterOffer = async (): Promise<string> => {
    const message = await trade.makeItWorkTrade();
    league.updateLastDbChange();
    return message;
};

const updateTrade = async (teams: [{
    tid: number,
    pids: number[],
    dpids: number[],
}, {
    tid: number,
    pids: number[],
    dpids: number[],
}]) => {
    await trade.updatePlayers(teams);
    league.updateLastDbChange();
};

export {
    acceptContractNegotiation,
    autoSortRoster,
    beforeViewLeague,
    beforeViewNonLeague,
    cancelContractNegotiation,
    checkAccount,
    checkParticipationAchievevment,
    clearTrade,
    clearWatchList,
    countNegotiations,
    createLeague,
    createTrade,
    deleteOldData,
    draftUntilUserOrEnd,
    draftUser,
    exportLeague,
    exportPlayerAveragesCsv,
    exportPlayerGamesCsv,
    getLeagueName,
    getTradingBlockOffers,
    handleUploadedDraftClass,
    init,
    proposeTrade,
    releasePlayer,
    removeLeague,
    reorderRosterDrag,
    reorderRosterSwap,
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
