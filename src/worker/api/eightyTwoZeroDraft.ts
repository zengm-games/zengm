import { applyRealTeamInfo } from "../../common/applyRealTeamInfo.ts";
import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import {
	LEAGUE_DATABASE_VERSION,
	PHASE,
	REAL_PLAYERS_INFO,
} from "../../common/constants.ts";
import { choice, randInt, shuffle } from "../../common/random.ts";
import type {
	Conditions,
	Phase,
	Player,
	PlayerWithoutKey,
	Team,
} from "../../common/types.ts";
import { last, orderBy, range } from "../../common/utils.ts";
import { player, realRosters, team } from "../core/index.ts";
import getRealTeamPlayerData from "../core/league/create/getRealTeamPlayerData.ts";
import { applyRealPlayerPhotos } from "../core/league/processPlayerNewLeague.ts";
import oldAbbrevTo2020BBGMAbbrev from "../core/realRosters/oldAbbrevTo2020BBGMAbbrev.ts";
import { idb } from "../db/index.ts";
import { g, helpers, local, toUI } from "../util/index.ts";
import { getRealTeamInfo } from "../views/newLeague.ts";
import {
	countPickablePlayers,
	getLockedCount,
	getPickValidationError,
} from "./eightyTwoZeroDraftHelpers.ts";

const NUM_EIGHTY_TWO_ZERO_DRAFT_ROUNDS = 12;

type EightyTwoZeroDraftTeam = Pick<
	Team,
	"abbrev" | "imgURL" | "imgURLSmall" | "name" | "region" | "tid"
> & {
	players: Player[];
	season: number;
	seasonInfo?: {
		won: number;
		lost: number;
		tied: number;
		otl: number;
		roundsWonText?: string;
	};
	srID: string;
};

let finalizing = false;

const getActiveDraftErrorMessage = (phase: Phase) => {
	if (phase === PHASE.DRAFT) {
		return "You can't start an 82-0 Draft while a regular draft is already in progress.";
	}

	if (phase === PHASE.FANTASY_DRAFT) {
		return "You can't start an 82-0 Draft while a fantasy draft is already in progress.";
	}

	if (phase === PHASE.EXPANSION_DRAFT) {
		return "You can't start an 82-0 Draft while an expansion draft is already in progress.";
	}
};

const getState = () => {
	const draft = local.eightyTwoZeroDraft;
	return {
		loading: false,
		started: draft !== undefined,
		...(draft ?? helpers.deepCopy(DEFAULT_EIGHTY_TWO_ZERO_DRAFT)),
	};
};

export const checkCanUse = () => {
	if (!g.get("godMode")) {
		throw new Error("God Mode is required for 82-0 Draft");
	}

	if (!REAL_PLAYERS_INFO) {
		throw new Error("82-0 Draft is only available for basketball");
	}

	const activeDraftErrorMessage = getActiveDraftErrorMessage(g.get("phase"));
	if (activeDraftErrorMessage) {
		throw new Error(activeDraftErrorMessage);
	}
};

const getContractExp = () => {
	return (
		g.get("season") + (g.get("phase") > PHASE.AFTER_TRADE_DEADLINE ? 1 : 0)
	);
};

const getCappedLockedCount = (round: number, numPlayers: number) => {
	return Math.min(getLockedCount(round), Math.max(numPlayers - 1, 0));
};

const fetchRandomTeam = async (
	option:
		| {
				season: number;
				prevSeason?: undefined;
				srID?: undefined;
		  }
		| {
				season?: undefined;
				prevSeason: number;
				srID: string;
		  }
		| undefined,
) => {
	if (!REAL_PLAYERS_INFO) {
		throw new Error("82-0 Draft is only available for basketball.");
	}

	const draft = local.eightyTwoZeroDraft!;

	const getTeam = async (season: number) => {
		const info = await realRosters.getLeagueInfo({
			type: "real",
			season,
			phase: PHASE.PLAYOFFS,
			randomDebuts: false,
			randomDebutsKeepCurrent: false,
			realDraftRatings: "rookie",
			realStats: "lastSeason",
			includeSeasonInfo: true,
			includePlayers: false,
			pidOffset: draft.round * 10000,
			preservePlayerOvrContext: true,
		});

		let teams = info.teams as unknown as EightyTwoZeroDraftTeam[];
		if (option?.srID) {
			const abbrev = oldAbbrevTo2020BBGMAbbrev(option.srID);
			teams = teams.filter((t) => oldAbbrevTo2020BBGMAbbrev(t.srID) === abbrev);
		}

		if (teams.length > 0) {
			return choice(teams);
		}
	};

	const NUM_TRIES_TO_FIND_TEAM = 10;
	let season;
	let t;
	for (let i = 0; i < NUM_TRIES_TO_FIND_TEAM; i++) {
		season =
			option?.season ??
			randInt(REAL_PLAYERS_INFO.MIN_SEASON, REAL_PLAYERS_INFO.MAX_SEASON);
		t = await getTeam(season);
		if (t) {
			break;
		}
	}

	if (!t || season === undefined) {
		// Couldn't find a team in a random year in NUM_TRIES_TO_FIND_TEAM tries... search within +/- 5 years of previous season, in case this was a brief existence
		if (option?.srID !== undefined) {
			const seasons = [
				Math.max(REAL_PLAYERS_INFO.MIN_SEASON, option.prevSeason - 5),
				Math.min(REAL_PLAYERS_INFO.MAX_SEASON, option.prevSeason + 5),
			] as const;
			const allSeasons = range(seasons[0], seasons[1] + 1);
			shuffle(allSeasons);
			for (const mySeason of allSeasons) {
				t = await getTeam(mySeason);
				console.log("fallback got", mySeason, t);
				if (t) {
					season = mySeason;
					break;
				}
			}
		}

		if (!t || season === undefined) {
			throw new Error("Failed to find team");
		}
	}

	const lockedCount = getCappedLockedCount(draft.round, t.players.length);

	// This sort is used for disabling/locking players, not for anything else in the UI
	const players = orderBy(t.players, (p) => last(p.ratings).ovr, "desc").map(
		(p, i) => {
			return {
				locked: draft.lockTopPlayers && i < lockedCount,
				p,
			};
		},
	);

	if (draft.eliteBallKnowerMode) {
		shuffle(players);
	}

	return {
		...t,
		players,
		season,
	};
};

const loadRandomTeam = async (lifeline?: "newSeason" | "newTeam") => {
	const draft = local.eightyTwoZeroDraft;
	if (!draft) {
		throw new Error("No 82-0 Draft in progress.");
	}

	const realTeamInfo = await getRealTeamInfo();

	const MAX_RANDOM_TEAM_RETRIES = 100;
	const option: Parameters<typeof fetchRandomTeam>[0] =
		!draft.currentTeam || !lifeline
			? undefined
			: lifeline === "newSeason"
				? {
						prevSeason: draft.currentTeam.season,
						srID: draft.currentTeam.srID,
					}
				: {
						season: draft.currentTeam.season,
					};
	for (let i = 0; i < MAX_RANDOM_TEAM_RETRIES; i++) {
		const currentTeam = await fetchRandomTeam(option);

		const pickableCount = countPickablePlayers(
			currentTeam.players,
			draft.picks,
		);
		if (pickableCount > 0) {
			if (realTeamInfo) {
				applyRealTeamInfo(currentTeam, realTeamInfo, currentTeam.season);
			}
			draft.currentTeam = currentTeam;
			return;
		}
	}

	throw new Error("Could not find a real team with an available player.");
};

export const DEFAULT_EIGHTY_TWO_ZERO_DRAFT = {
	round: 1,
	picks: [],
	currentTeam: undefined,
	eliteBallKnowerMode: false,
	lifelinesUsed: {
		newTeam: false,
		newSeason: false,
		unlock: false,
	},
	lockTopPlayers: true,
};

const start = async ({
	eliteBallKnowerMode,
	lockTopPlayers,
}: {
	eliteBallKnowerMode: boolean;
	lockTopPlayers: boolean;
}) => {
	checkCanUse();

	local.eightyTwoZeroDraft = helpers.deepCopy(DEFAULT_EIGHTY_TWO_ZERO_DRAFT);
	local.eightyTwoZeroDraft.eliteBallKnowerMode = eliteBallKnowerMode;
	local.eightyTwoZeroDraft.lockTopPlayers = lockTopPlayers;
	try {
		await loadRandomTeam();
	} catch (error) {
		// Otherwise a failed initial load leaves started=true with no
		// currentTeam, and the view is stuck on Loading with no recovery.
		local.eightyTwoZeroDraft = undefined;
		throw error;
	}

	return getState();
};

const useLifeline = async (lifeline: "newTeam" | "newSeason" | "unlock") => {
	const draft = local.eightyTwoZeroDraft;
	if (!draft) {
		throw new Error("No 82-0 Draft in progress");
	}

	if (draft.lifelinesUsed[lifeline]) {
		throw new Error("Lifeline already used");
	}

	if (lifeline === "newTeam" || lifeline === "newSeason") {
		await loadRandomTeam(lifeline);
		draft.lifelinesUsed[lifeline] = true;
	} else {
		if (draft.currentTeam) {
			draft.currentTeam.players = draft.currentTeam.players.map((row) => {
				return {
					locked: false,
					p: row.p,
				};
			});
			draft.lifelinesUsed.unlock = true;
		}
	}

	return getState();
};

const pick = async ({
	expectedRound,
	pickIndex,
}: {
	expectedRound: number;
	pickIndex: number;
}) => {
	checkCanUse();

	const draft = local.eightyTwoZeroDraft;
	if (!draft) {
		throw new Error("No 82-0 Draft in progress");
	}

	if (draft.round !== expectedRound) {
		throw new Error("This draft has already advanced to another round");
	}

	const currentTeam = draft.currentTeam;
	if (!currentTeam) {
		throw new Error("No team is available for this round");
	}

	const playerInfo = helpers.deepCopy(currentTeam.players[pickIndex]);

	const validationError = getPickValidationError({
		picks: draft.picks,
		playerInfo,
	});
	if (validationError) {
		throw new Error(validationError);
	}
	const p = playerInfo!.p;

	const previousRound = draft.round;
	draft.picks.push({
		p,
		teamAbbrev: currentTeam.abbrev,
		season: currentTeam.season,
	});

	if (draft.picks.length === NUM_EIGHTY_TWO_ZERO_DRAFT_ROUNDS) {
		draft.currentTeam = undefined;
		return getState();
	}

	draft.round += 1;
	draft.currentTeam = undefined;
	try {
		await loadRandomTeam();
	} catch (error) {
		draft.picks.pop();
		draft.round = previousRound;
		draft.currentTeam = currentTeam;
		throw error;
	}

	return getState();
};

const normalizePick = async (
	pick: NonNullable<typeof local.eightyTwoZeroDraft>["picks"][number],
	teamJerseyNumbers: string[],
) => {
	const p: PlayerWithoutKey = helpers.deepCopy(pick.p);
	delete p.pid;

	const seasonOffset = g.get("season") - pick.season;
	p.born.year += seasonOffset;
	p.draft.year += seasonOffset;
	p.tid = g.get("userTid");
	p.retiredYear = Infinity;
	p.gamesUntilTradable = 0;
	p.injuries = [];
	p.injury = {
		type: "Healthy",
		gamesRemaining: 0,
	};
	p.numDaysFreeAgent = 0;
	p.ptModifier = 1;
	p.salaries = [];
	p.stats = [];
	p.statsTids = [];
	p.watch = undefined;
	p.yearsFreeAgent = 0;

	const ratings = helpers.deepCopy(last(p.ratings));
	ratings.season = g.get("season");
	p.ratings = [ratings];
	p.draft.ovr = ratings.ovr;
	p.draft.pot = ratings.pot;
	p.draft.skills = ratings.skills;

	player.setContract(
		p,
		{
			amount: g.get("minContract"),
			exp: getContractExp(),
		},
		true,
	);

	const p2 = await player.augmentPartialPlayer(
		p,
		DEFAULT_LEVEL,
		LEAGUE_DATABASE_VERSION,
	);
	player.setJerseyNumber(
		p2,
		await player.genJerseyNumber(p2, teamJerseyNumbers),
	);
	teamJerseyNumbers.push(p2.jerseyNumber!);
	await player.updateValues(p2);

	return p2;
};

const finalize = async (param: unknown, conditions: Conditions) => {
	checkCanUse();

	if (finalizing) {
		throw new Error("82-0 Draft is already finalizing.");
	}

	const draft = local.eightyTwoZeroDraft;
	if (!draft || draft.picks.length !== NUM_EIGHTY_TWO_ZERO_DRAFT_ROUNDS) {
		throw new Error("You must draft 12 players before finalizing.");
	}

	finalizing = true;
	try {
		const teamJerseyNumbers: string[] = [];
		const playersToAdd: Player[] = [];
		for (const pick of draft.picks) {
			playersToAdd.push(await normalizePick(pick, teamJerseyNumbers));
		}

		const oldRoster = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		for (const p of oldRoster) {
			await player.retire(p, conditions);
			await idb.cache.players.put(p);
		}

		const { realPlayerPhotos } = await getRealTeamPlayerData(
			{ fileHasPlayers: true, fileHasTeams: false },
			conditions,
		);

		for (const p of playersToAdd) {
			applyRealPlayerPhotos(realPlayerPhotos, p);
			await idb.cache.players.put(p);
		}
		await team.rosterAutoSort(g.get("userTid"), false);

		local.eightyTwoZeroDraft = undefined;
		await toUI("realtimeUpdate", [["playerMovement"]]);

		return getState();
	} finally {
		finalizing = false;
	}
};

const cancel = async () => {
	local.eightyTwoZeroDraft = undefined;
	return getState();
};

export default {
	cancel,
	finalize,
	pick,
	start,
	useLifeline,
};
