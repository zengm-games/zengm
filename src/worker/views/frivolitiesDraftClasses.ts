import { idb } from "../db/index.ts";
import { g, processPlayersHallOfFame } from "../util/index.ts";
import type {
	UpdateEvents,
	Player,
	MinimalPlayerRatings,
} from "../../common/types.ts";
import { bySport, PHASE } from "../../common/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { orderBy } from "../../common/utils.ts";

const playerValue = (p: Player<MinimalPlayerRatings>) => {
	let sum = 0;
	for (const ps of p.stats) {
		sum += bySport({
			baseball: ps.war,
			basketball: ps.ows + ps.dws,
			football: ps.av,
			hockey: ps.dps + ps.ops + ps.gps,
		});
	}

	return sum;
};

const updateFrivolitiesDraftClasses = async (
	input: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON)
	) {
		type DraftClass = {
			season: number;
			value: number;
			numHOF: number;
			numMVP: number;
			numAS: number;
			numActive: number;
			bestPlayer: {
				p: Player<MinimalPlayerRatings>;
				value: number;
			};
		};
		let draftClass: DraftClass | undefined;
		const draftClasses: DraftClass[] = [];

		const mostRecentDraftYear =
			g.get("phase") >= PHASE.DRAFT ? g.get("season") : g.get("season") - 1;

		for await (const { value: p } of idb.league
			.transaction("players")
			.store.index("draft.year, retiredYear")
			.iterate(
				IDBKeyRange.bound(
					[Math.min(mostRecentDraftYear, g.get("startingSeason"))],
					[mostRecentDraftYear, Infinity],
				),
			)) {
			const value = playerValue(p);

			if (draftClass === undefined || p.draft.year !== draftClass.season) {
				draftClass = {
					season: p.draft.year,
					value: 0,
					numHOF: 0,
					numMVP: 0,
					numAS: 0,
					numActive: 0,
					bestPlayer: {
						p,
						value,
					},
				};
				draftClasses.push(draftClass);
			} else {
				if (value > draftClass.bestPlayer.value) {
					draftClass.bestPlayer = {
						p,
						value,
					};
				}
			}

			draftClass.value += value;
			if (p.hof) {
				draftClass.numHOF += 1;
			}
			if (p.awards.some((award) => award.type === "Most Valuable Player")) {
				draftClass.numMVP += 1;
			}
			if (p.awards.some((award) => award.type === "All-Star")) {
				draftClass.numAS += 1;
			}
			if (p.retiredYear === Infinity) {
				draftClass.numActive += 1;
			}
		}

		const stats = bySport({
			baseball: ["gp", "keyStats", "war"],
			basketball: [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"per",
				"ewa",
				"ws",
				"ws48",
			],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});

		const bestPlayersAll = draftClasses.map(
			(draftClass) => draftClass.bestPlayer.p,
		);
		const bestPlayers = addFirstNameShort(
			processPlayersHallOfFame(
				await idb.getCopies.playersPlus(bestPlayersAll, {
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"draft",
						"retiredYear",
						"statsTids",
						"born",
						"diedYear",
						"jerseyNumber",
					],
					ratings: ["season", "ovr", "pos"],
					stats: ["season", "abbrev", "tid", ...stats],
					fuzz: true,
				}),
			),
		);

		const draftClasses2 = orderBy(
			draftClasses.map((draftClass, i) => ({
				...draftClass,
				bestPlayer: bestPlayers[i],
			})),
			"value",
			"desc",
		);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			draftClasses: draftClasses2,
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updateFrivolitiesDraftClasses;
