import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { DraftPick } from "../../../common/types";
import { PHASE } from "../../../common";

// Add a new set of draft picks, or confirm that the existing picks are correct (because this is idempotent!)
const doSeason = async (
	season: number,
	existingPicks: (DraftPick & {
		keep?: boolean;
	})[],
) => {
	const teams = await idb.cache.teams.getAll();

	// If draft is ongoing, don't create picks because some may have already been used. And in the case that all have been used, there's no way to know for sure, so this is the best we can do.
	const ongoingDraft =
		g.get("season") === season && g.get("phase") === PHASE.DRAFT;

	const userTids = g.get("userTids");
	const challengeNoDraftPicks = g.get("challengeNoDraftPicks");

	for (let round = 1; round <= g.get("numDraftRounds"); round++) {
		for (const t of teams) {
			if (t.disabled) {
				continue;
			}

			// If a pick already exists in the database, no need to create it
			const existingPick = existingPicks.find(dp => {
				return (
					t.tid === dp.originalTid && round === dp.round && season === dp.season
				);
			});

			const skipChallengeMode =
				challengeNoDraftPicks && userTids.includes(t.tid);

			if (existingPick) {
				const deletePickChallengeMode =
					skipChallengeMode && userTids.includes(existingPick.tid);
				if (!deletePickChallengeMode) {
					existingPick.keep = true;
				}
			} else if (!ongoingDraft) {
				if (!skipChallengeMode) {
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
	for (let i = 0; i < numSeasons; i++) {
		const draftYear = g.get("season") + dpOffset + i;
		await doSeason(draftYear, existingPicks);
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
	} else if (realPlayers) {
		for (const existingPick of existingPicks) {
			if (existingPick.season === g.get("season")) {
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
