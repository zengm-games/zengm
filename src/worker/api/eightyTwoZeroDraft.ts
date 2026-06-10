import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import {
	LEAGUE_DATABASE_VERSION,
	PHASE,
	REAL_PLAYERS_INFO,
} from "../../common/constants.ts";
import { choice, randInt } from "../../common/random.ts";
import type { Phase, PlayerWithoutKey, Team } from "../../common/types.ts";
import { last, orderBy } from "../../common/utils.ts";
import { player, realRosters, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers, local, toUI, updatePlayMenu } from "../util/index.ts";
import {
	MAX_RANDOM_TEAM_RETRIES,
	NUM_EIGHTY_TWO_ZERO_DRAFT_ROUNDS,
	countPickablePlayers,
	getDisabledCount,
	getPickValidationError,
} from "./eightyTwoZeroDraftHelpers.ts";

type EightyTwoZeroDraftTeam = Pick<
	Team,
	"abbrev" | "imgURL" | "name" | "region" | "srID" | "tid"
> & {
	players: PlayerWithoutKey[];
	season: number;
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
		activeDraftErrorMessage: getActiveDraftErrorMessage(g.get("phase")),
		godMode: g.get("godMode"),
		loading: false,
		realPlayers: REAL_PLAYERS_INFO !== undefined,
		started: draft !== undefined,
		...(draft ?? {
			currentTeam: undefined,
			picks: [],
			round: 1,
		}),
	};
};

const checkCanUse = () => {
	if (!g.get("godMode")) {
		throw new Error("God Mode is required for 82-0 Draft.");
	}

	if (!REAL_PLAYERS_INFO) {
		throw new Error("82-0 Draft is only available for basketball.");
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

const fetchRandomTeam = async () => {
	if (!REAL_PLAYERS_INFO) {
		throw new Error("82-0 Draft is only available for basketball.");
	}

	const oldSeason = g.get("season");
	const oldNumActiveTeams = g.get("numActiveTeams");
	const oldPlayerOvrMean = local.playerOvrMean;
	const oldPlayerOvrStd = local.playerOvrStd;
	const oldPlayerOvrMeanStdStale = local.playerOvrMeanStdStale;

	try {
		const season = randInt(
			REAL_PLAYERS_INFO.MIN_SEASON,
			REAL_PLAYERS_INFO.MAX_SEASON,
		);
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
		});

		const teams = info.teams as unknown as EightyTwoZeroDraftTeam[];
		if (teams.length === 0) {
			throw new Error(`No real teams found for ${season}`);
		}

		const t = choice(teams);
		return {
			...t,
			disabledCount: getDisabledCount(local.eightyTwoZeroDraft!.round),
			players: orderBy(
				t.players.filter((p) => p.ratings.length > 0),
				(p) => last(p.ratings).ovr,
				"desc",
			),
			season,
		};
	} finally {
		g.setWithoutSavingToDB("season", oldSeason);
		g.setWithoutSavingToDB("numActiveTeams", oldNumActiveTeams);
		local.playerOvrMean = oldPlayerOvrMean;
		local.playerOvrStd = oldPlayerOvrStd;
		local.playerOvrMeanStdStale = oldPlayerOvrMeanStdStale;
	}
};

const getCappedDisabledCount = (round: number, players: PlayerWithoutKey[]) => {
	return Math.min(getDisabledCount(round), Math.max(players.length - 1, 0));
};

const loadRandomTeam = async () => {
	const draft = local.eightyTwoZeroDraft;
	if (!draft) {
		throw new Error("No 82-0 Draft in progress.");
	}

	let fallback:
		| (EightyTwoZeroDraftTeam & {
				disabledCount: number;
		  })
		| undefined;

	for (let i = 0; i < MAX_RANDOM_TEAM_RETRIES; i++) {
		const currentTeam = await fetchRandomTeam();
		const pickableCount = countPickablePlayers(
			currentTeam.players,
			getDisabledCount(draft.round),
			draft.picks,
		);
		if (pickableCount > 0) {
			draft.currentTeam = currentTeam;
			return;
		}

		const cappedDisabledCount = getCappedDisabledCount(
			draft.round,
			currentTeam.players,
		);
		if (
			!fallback &&
			countPickablePlayers(
				currentTeam.players,
				cappedDisabledCount,
				draft.picks,
			) > 0
		) {
			fallback = {
				...currentTeam,
				disabledCount: cappedDisabledCount,
			};
		}
	}

	if (fallback) {
		draft.currentTeam = fallback;
		return;
	}

	throw new Error("Could not find a real team with an available player.");
};

export const start = async () => {
	checkCanUse();

	local.eightyTwoZeroDraft = {
		round: 1,
		picks: [],
		currentTeam: undefined,
	};
	await loadRandomTeam();

	return getState();
};

export const pick = async ({
	expectedRound,
	pickIndex,
}: {
	expectedRound: number;
	pickIndex: number;
}) => {
	checkCanUse();

	const draft = local.eightyTwoZeroDraft;
	if (!draft) {
		throw new Error("No 82-0 Draft in progress.");
	}

	if (draft.round !== expectedRound) {
		throw new Error("This draft has already advanced to another round.");
	}

	const currentTeam = draft.currentTeam;
	if (!currentTeam) {
		throw new Error("No team is available for this round.");
	}

	const validationError = getPickValidationError({
		disabledCount: currentTeam.disabledCount,
		pickIndex,
		picks: draft.picks,
		players: currentTeam.players,
	});
	if (validationError) {
		throw new Error(validationError);
	}

	const previousRound = draft.round;
	const p = helpers.deepCopy(currentTeam.players[pickIndex]!);
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
	const p = helpers.deepCopy(pick.p);
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

export const finalize = async () => {
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
		const playersToAdd: PlayerWithoutKey[] = [];
		for (const pick of draft.picks) {
			playersToAdd.push(await normalizePick(pick, teamJerseyNumbers));
		}

		const oldRoster = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		await player.remove(oldRoster.map((p) => p.pid));

		for (const p of playersToAdd) {
			await idb.cache.players.put(p);
		}
		await team.rosterAutoSort(g.get("userTid"), false);

		local.eightyTwoZeroDraft = undefined;
		await updatePlayMenu();
		await toUI("realtimeUpdate", [["playerMovement"]]);

		return getState();
	} finally {
		finalizing = false;
	}
};

export const cancel = async () => {
	local.eightyTwoZeroDraft = undefined;
	return getState();
};
