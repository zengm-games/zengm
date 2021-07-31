import orderBy from "lodash-es/orderBy";
import { PHASE } from "../../../common";
import type {
	GetLeagueOptionsReal,
	ScheduledEventWithoutKey,
} from "../../../common/types";
import { defaultGameAttributes } from "../../util";
import formatPlayerFactory from "./formatPlayerFactory";
import type { Basketball } from "./loadData.basketball";

const getDraftClassSize = (
	numActiveTeams: number,
	numNewExpansionTeams: number,
) => {
	return Math.round(
		(defaultGameAttributes.numDraftRounds * numActiveTeams * 7) / 6 +
			numNewExpansionTeams * 6,
	);
};

const processScheduledEvents = (
	scheduledEvents: ScheduledEventWithoutKey[],
	draftYear: number,
) => {
	let numTeamsDiff = 0;
	let numNewExpansionTeams = 0;
	for (const event of scheduledEvents) {
		if (
			event.season < draftYear ||
			(event.season === draftYear && event.phase <= PHASE.DRAFT)
		) {
			if (event.type === "contraction") {
				numTeamsDiff -= 1;
			} else if (event.type === "expansionDraft") {
				numTeamsDiff += event.info.teams.length;
				if (event.season === draftYear && event.phase > PHASE.REGULAR_SEASON) {
					numNewExpansionTeams += event.info.teams.length;
				}
			}
		}
	}

	return {
		numTeamsDiff,
		numNewExpansionTeams,
	};
};

const getDraftProspects = async (
	basketball: Basketball,
	activePlayers: {
		srID: string;
	}[],
	initialTeams: {
		tid: number;
		srID?: string;
	}[],
	scheduledEvents: ScheduledEventWithoutKey[],
	lastPID: number,
	numPlayersInitialDraftYear: number,
	options: GetLeagueOptionsReal,
) => {
	const formatPlayer = await formatPlayerFactory(
		basketball,
		options,
		options.season,
		initialTeams,
		lastPID,
	);

	const initialDraftYear =
		options.phase > PHASE.DRAFT ? options.season + 1 : options.season;

	const seenSlugs = new Set(activePlayers.map(p => p.srID));
	const draftProspects = orderBy(basketball.ratings, ["slug", "season"])
		.filter(ratings => {
			// Only keep rookie seasons
			const seen = seenSlugs.has(ratings.slug);
			seenSlugs.add(ratings.slug);
			return !seen;
		})
		.filter(ratings => {
			if (options.randomDebuts) {
				return true;
			}

			// Normal rookies, whose first ratings season is their rookie year
			if (ratings.season > options.season) {
				return true;
			}

			// For 2021 (or later) draft prospects - anyone active in 2021 would have already been filered out by seenSlugs
			if (ratings.season === options.season) {
				return true;
			}

			return false;
		})
		.map(ratings =>
			formatPlayer(ratings, {
				draftProspect: true,
				randomDebuts: options.randomDebuts,
			}),
		);

	// Normalize the size of draft classes, based on the number of teams and the number of expansion teams
	if (options.randomDebuts) {
		let draftYear = initialDraftYear;
		let draftClassSize = numPlayersInitialDraftYear;
		let targetDraftClassSize: number | undefined;
		for (const p of draftProspects) {
			if (targetDraftClassSize === undefined) {
				const { numTeamsDiff, numNewExpansionTeams } = processScheduledEvents(
					scheduledEvents,
					draftYear,
				);
				targetDraftClassSize = getDraftClassSize(
					initialTeams.length + numTeamsDiff,
					numNewExpansionTeams,
				);
			}

			const diff = draftYear - p.draft.year;
			p.draft.year += diff;
			p.born.year += diff;
			draftClassSize += 1;

			if (draftClassSize >= targetDraftClassSize) {
				draftYear += 1;
				targetDraftClassSize = undefined;
				draftClassSize = 0;
			}
		}
	}

	return draftProspects;
};

export default getDraftProspects;
