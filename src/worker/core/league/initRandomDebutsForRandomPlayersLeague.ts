import omit from "lodash-es/omit";
import orderBy from "lodash-es/orderBy";
import { PHASE } from "../../../common";
import type {
	GameAttributesLeagueWithHistory,
	PlayerWithoutKey,
} from "../../../common/types";
import { defaultGameAttributes, random } from "../../util";
import type { Settings } from "../../views/settings";
import formatPlayerFactory from "../realRosters/formatPlayerFactory";
import type { Basketball } from "../realRosters/loadData.basketball";

// Code inside realPlayers is responsible for random debuts normally. But that only works for real players leagues, not random players leagues. So here is a standalone version. Maybe these should be used in realPlayers too, would be more DRY...
const initRandomDebutsForRandomPlayersLeague = async ({
	players,
	basketball,
	numActiveTeams,
	realDraftRatings,
	phase,
	season,
}: {
	basketball: Basketball;
	players: PlayerWithoutKey[];
	realDraftRatings: Settings["realDraftRatings"];
} & Pick<
	GameAttributesLeagueWithHistory,
	"numActiveTeams" | "phase" | "season"
>) => {
	const formatPlayer = await formatPlayerFactory(
		basketball,
		{
			type: "real",
			season,
			phase,
			randomDebuts: true,
			randomDebutsKeepCurrent: false,
			realDraftRatings,
			realStats: "none",
		},
		season,
		[],
		0,
	);

	const initialDraftYear = phase > PHASE.DRAFT ? season + 1 : season;

	const seenSlugs = new Set<string>(
		// @ts-expect-error
		players.filter(p => p.srID !== undefined).map(p => p.srID),
	);
	const draftProspects = orderBy(basketball.ratings, ["slug", "season"])
		.filter(ratings => {
			// Only keep rookie seasons
			const seen = seenSlugs.has(ratings.slug);
			seenSlugs.add(ratings.slug);
			return !seen;
		})
		.map(ratings =>
			formatPlayer(ratings, {
				draftProspect: true,
			}),
		);

	random.shuffle(draftProspects);

	// Normalize the size of draft classes, based on the number of teams and the number of expansion teams
	let draftYear = initialDraftYear;
	let draftClassSize = 0;
	const targetDraftClassSize = Math.round(
		(defaultGameAttributes.numDraftRounds * numActiveTeams * 7) / 6,
	);
	for (const p of draftProspects) {
		const diff = draftYear - p.draft.year;
		p.draft.year += diff;
		p.born.year += diff;
		draftClassSize += 1;

		if (draftClassSize >= targetDraftClassSize) {
			draftYear += 1;
			draftClassSize = 0;
		}
	}

	return draftProspects.map(p => omit(p, "pid"));
};

export default initRandomDebutsForRandomPlayersLeague;
