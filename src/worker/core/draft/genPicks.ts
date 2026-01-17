import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import type { DraftPick } from "../../../common/types.ts";
import { PHASE, REAL_PLAYERS_INFO } from "../../../common/index.ts";
import { groupBy } from "../../../common/utils.ts";

// Add a new set of draft picks, or confirm that the existing picks are correct (because this is idempotent!)
const doSeason = async (
	season: number,
	existingPicks: (DraftPick & {
		keep?: boolean;
	})[],
	realPlayers: boolean | undefined,
) => {
	// Some real drafts included forfeited picks, so we don't want to recreate them here if this is a new real players league and there are some draft picks for this season
	if (realPlayers && existingPicks.length > 0) {
		for (const dp of existingPicks) {
			dp.keep = true;
		}
		return;
	}

	const teams = await idb.cache.teams.getAll();

	// If draft is ongoing, don't create picks because some may have already been used. And in the case that all have been used, there's no way to know for sure, so this is the best we can do.
	const ongoingDraft =
		g.get("season") === season && g.get("phase") === PHASE.DRAFT;

	// With forceHistoricalRosters enabled, we only want picks after this mode will turn off
	const skipForceHistoricalRosters =
		REAL_PLAYERS_INFO &&
		g.get("forceHistoricalRosters") &&
		season < REAL_PLAYERS_INFO.MAX_SEASON;
	const skipRepeatSeason = !!g.get("repeatSeason");

	const userTids = g.get("userTids");
	const challengeNoDraftPicks = g.get("challengeNoDraftPicks");

	for (let round = 1; round <= g.get("numDraftRounds"); round++) {
		for (const t of teams) {
			if (t.disabled) {
				continue;
			}

			// If a pick already exists in the database, no need to create it
			const existingPick = existingPicks.find((dp) => {
				return t.tid === dp.originalTid && round === dp.round;
			});

			const skipChallengeMode =
				challengeNoDraftPicks && userTids.includes(t.tid);

			if (existingPick) {
				const deletePick =
					(skipChallengeMode && userTids.includes(existingPick.tid)) ||
					skipForceHistoricalRosters ||
					skipRepeatSeason;
				if (!deletePick) {
					existingPick.keep = true;
				}
			} else if (
				!ongoingDraft &&
				!skipChallengeMode &&
				!skipForceHistoricalRosters &&
				!skipRepeatSeason
			) {
				await idb.cache.draftPicks.add({
					tid: t.tid,
					originalTid: t.tid,
					round,
					pick: 0,
					season,
				});
			}
		}
	}
};

// realPlayers means the picks came from a real players roster, in which case we don't want to apply this normalization because some historical drafts were weird (or were normal and we don't know originalTid). Only current year, currently. The bulk of this work is done by ongoingDraft above, not by this realPlayers option, which may not actually do anything now! Could be useful if more seasons are included in the future.
const genPicks = async ({
	afterDraft,
	realPlayers,
}: {
	afterDraft?: boolean;
	realPlayers?: boolean;
} = {}) => {
	// If a pick already exists, do nothing. Unless it needs to be deleted because of challenge mode or some other reason.
	const existingPicks: (DraftPick & {
		keep?: boolean;
	})[] = helpers.deepCopy(await idb.cache.draftPicks.getAll());

	let numSeasons = g.get("numSeasonsFutureDraftPicks");
	if (
		numSeasons <= 0 &&
		g.get("phase") >= PHASE.DRAFT_LOTTERY &&
		g.get("phase") <= PHASE.DRAFT &&
		!afterDraft
	) {
		// We kind of need one season at least, for the actual draft
		numSeasons = 1;
	}

	const dpOffset = g.get("phase") > PHASE.DRAFT || afterDraft ? 1 : 0;
	const existingPicksBySeason = groupBy(existingPicks, "season");
	for (let i = 0; i < numSeasons; i++) {
		const draftYear = g.get("season") + dpOffset + i;
		await doSeason(
			draftYear,
			existingPicksBySeason[draftYear] ?? [],
			realPlayers,
		);
	}

	if (g.get("phase") === PHASE.FANTASY_DRAFT) {
		for (const existingPick of existingPicks) {
			if (existingPick.season === "fantasy") {
				existingPick.keep = true;
			}
		}
	} else if (g.get("phase") === PHASE.EXPANSION_DRAFT) {
		for (const existingPick of existingPicks) {
			if (existingPick.season === "expansion") {
				existingPick.keep = true;
			}
		}
	}

	// Delete any obsolete picks
	for (const existingPick of existingPicks) {
		if (!existingPick.keep) {
			await idb.cache.draftPicks.delete(existingPick.dpid);
		}
	}
};

export default genPicks;
