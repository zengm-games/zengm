import { finances, league, player } from "..";
import { idb } from "../../db";
import { g, random } from "../../util";
import getDraftProspects from "./getDraftProspects";
import loadDataBasketball from "./loadData.basketball";
import addRelatives from "./addRelatives";
import { MAX_SUPPORTED_LEAGUE_VERSION, PHASE } from "../../../common";

const updateRandomDebutsForever = async (
	draftYear: number,
	numPlayersDraftYear: number,
) => {
	const iteration = (g.get("randomDebutsForever") ?? 1) + 1;

	const basketball = await loadDataBasketball();

	const currentTeams = (await idb.cache.teams.getAll()).filter(
		t => !t.disabled,
	);

	const scheduledEvents = await idb.cache.scheduledEvents.getAll();

	const lastPID = idb.cache._maxIds.players;

	const draftProspects = await getDraftProspects(
		basketball,
		[],
		currentTeams,
		scheduledEvents,
		lastPID,
		numPlayersDraftYear,
		{
			type: "real",
			season: draftYear,
			phase: PHASE.DRAFT, // Faked, so initialDraftYear is correct in getDraftProspects
			randomDebuts: true,
			realDraftRatings: g.get("realDraftRatings") ?? "draft",
			realStats: "none",
		},
	);

	for (const p of draftProspects) {
		p.name += ` v${iteration}`;
	}

	addRelatives(draftProspects, basketball.relatives);

	// Randomize draft classes
	const draftYears = draftProspects.map(p => p.draft.year);
	random.shuffle(draftYears);
	for (let i = 0; i < draftProspects.length; i++) {
		const p = draftProspects[i];
		const diff = draftYears[i] - p.draft.year;
		p.draft.year = draftYears[i];
		p.born.year += diff;
	}

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[
			[g.get("userTid"), g.get("season") - 2],
			[g.get("userTid"), g.get("season")],
		],
	);
	const scoutingRank = finances.getRankLastThree(
		teamSeasons,
		"expenses",
		"scouting",
	);

	for (const p of draftProspects) {
		const p2 = await player.augmentPartialPlayer(
			p,
			scoutingRank,
			MAX_SUPPORTED_LEAGUE_VERSION,
			true,
		);
		await player.updateValues(p2);
		await idb.cache.players.put(p2);
	}

	await league.setGameAttributes({
		randomDebutsForever: iteration,
	});
};

export default updateRandomDebutsForever;
