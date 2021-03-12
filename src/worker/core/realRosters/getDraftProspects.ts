import orderBy from "lodash/orderBy";
import { PLAYER } from "../../../common";
import type { GetLeagueOptionsReal } from "../../../common/types";
import formatPlayerFactory from "./formatPlayerFactory";
import type { Basketball } from "./loadData.basketball";

const getDraftProspects = (
	basketball: Basketball,
	activePlayers: {
		srID: string;
	}[],
	teams: {
		tid: number;
		srID?: string;
	}[],
	lastPID: number,
	options: GetLeagueOptionsReal,
) => {
	const formatPlayer = formatPlayerFactory(
		basketball,
		options,
		options.season,
		teams,
		lastPID,
	);

	const seenSlugs = new Set(activePlayers.map(p => p.srID));
	const draftProspects = orderBy(basketball.ratings, ["slug", "season"])
		.filter(ratings => {
			// Only keep rookie seasons
			const seen = seenSlugs.has(ratings.slug);
			seenSlugs.add(ratings.slug);
			return !seen;
		})
		.filter(ratings => ratings.season > options.season || options.randomDebuts)
		.map(ratings =>
			formatPlayer(ratings, {
				draftProspect: true,
				randomDebuts: options.randomDebuts,
			}),
		);

	if (options.randomDebuts) {
		// For players in past draft classes, automatically move to future draft classes, so they will be correctly randomized below
		const targetDraftClassSize = 70;
		const draftProspectsToMove = draftProspects.filter(
			p => p.draft.year < options.season,
		);
		let draftYear = options.season;
		let draftClassSize = draftProspects.filter(p => p.draft.year === draftYear)
			.length;
		while (draftProspectsToMove.length > 0) {
			while (draftClassSize >= targetDraftClassSize) {
				draftYear += 1;
				draftClassSize = draftProspects.filter(p => p.draft.year === draftYear)
					.length;
			}

			const p = draftProspectsToMove.pop();
			if (p) {
				p.tid = PLAYER.UNDRAFTED;

				const diff = draftYear - p.draft.year;
				p.draft.year += diff;
				p.born.year += diff;
				draftClassSize += 1;
			}
		}
	}

	return draftProspects;
};

export default getDraftProspects;
