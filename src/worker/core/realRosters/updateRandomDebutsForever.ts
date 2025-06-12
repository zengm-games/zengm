import { finances, league, player } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, random } from "../../util/index.ts";
import getDraftProspects from "./getDraftProspects.ts";
import loadDataBasketball from "./loadData.basketball.ts";
import addRelatives from "./addRelatives.ts";
import { LEAGUE_DATABASE_VERSION, PHASE } from "../../../common/index.ts";

const updateRandomDebutsForever = async (
	draftYear: number,
	numPlayersDraftYear: number,
) => {
	const iteration = (g.get("randomDebutsForever") ?? 1) + 1;

	const basketball = await loadDataBasketball();

	const currentTeams = (await idb.cache.teams.getAll()).filter(
		(t) => !t.disabled,
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
			randomDebutsKeepCurrent: false,
			realDraftRatings: g.get("realDraftRatings") ?? "draft",
			realStats: "none",
			includePlayers: true,
		},
	);

	for (const p of draftProspects) {
		p.name += ` v${iteration}`;
	}

	addRelatives(draftProspects, basketball.relatives);

	// Randomize draft classes
	const draftYears = draftProspects.map((p) => p.draft.year);
	random.shuffle(draftYears);
	for (const [i, p] of draftProspects.entries()) {
		const draftYear = draftYears[i]!;
		const diff = draftYear - p.draft.year;
		p.draft.year = draftYear;
		p.born.year += diff;
	}

	const scoutingLevel = await finances.getLevelLastThree("scouting", {
		tid: g.get("userTid"),
	});

	for (const p of draftProspects) {
		const p2 = await player.augmentPartialPlayer(
			p,
			scoutingLevel,
			LEAGUE_DATABASE_VERSION,
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
