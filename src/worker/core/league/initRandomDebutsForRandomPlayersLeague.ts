import { PHASE, RATINGS } from "../../../common/index.ts";
import type {
	GameAttributesLeagueWithHistory,
	PlayerWithoutKey,
} from "../../../common/types.ts";
import { defaultGameAttributes, random } from "../../util/index.ts";
import type { Settings } from "../../views/settings.ts";
import formatPlayerFactory from "../realRosters/formatPlayerFactory.ts";
import type { Basketball } from "../realRosters/loadData.basketball.ts";
import { countBy, groupBy, omit, orderBy } from "../../../common/utils.ts";
import { getNumPlayersPerTeam } from "./create/createRandomPlayers.ts";
import { choice } from "../../../common/random.ts";

const getTidsWithNoPlayers = (
	activeTids: number[],
	players: PlayerWithoutKey[],
) => {
	const counts = countBy(players, "tid");
	return activeTids.filter((tid) => counts[tid] === undefined);
};

// Code inside realPlayers is responsible for random debuts normally. But that only works for real players leagues, not random players leagues. So here is a standalone version. Maybe these should be used in realPlayers too, would be more DRY...
const initRandomDebutsForRandomPlayersLeague = async ({
	activeTids,
	players,
	basketball,
	numActiveTeams,
	realDraftRatings,
	phase,
	season,
}: {
	activeTids: number[];
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
			includePlayers: true,
		},
		season,
		[],
		0,
	);

	const initialDraftYear = phase > PHASE.DRAFT ? season + 1 : season;

	const seenSlugs = new Set<string>(
		// @ts-expect-error
		players.filter((p) => p.srID !== undefined).map((p) => p.srID),
	);
	const realPlayers = orderBy(basketball.ratings, ["slug", "season"])
		.filter((ratings) => {
			// Only keep rookie seasons
			const seen = seenSlugs.has(ratings.slug);
			seenSlugs.add(ratings.slug);
			return !seen;
		})
		.map((ratings) =>
			formatPlayer(ratings, {
				draftProspect: true,
			}),
		);

	random.shuffle(realPlayers);

	// If necessary, put some players on empty teams - this works a bit different than in real players leagues, which matches players by age, whereas this one just picks random players at random seasons
	const tidsWithNoPlayers = getTidsWithNoPlayers(activeTids, players);
	if (tidsWithNoPlayers.length > 0) {
		const numPlayerPerTeam = getNumPlayersPerTeam();
		const ratingsBySlug = groupBy(basketball.ratings, "slug");

		let i = -1;
		for (const tid of tidsWithNoPlayers) {
			for (let j = 0; j < numPlayerPerTeam; j++) {
				// Find a valid player (not just a draft prospect)
				let p, ratingsToApply;
				while (i < realPlayers.length && (!p || !ratingsToApply)) {
					i += 1;

					p = realPlayers[i];
					if (!p) {
						continue;
					}

					const allRatings = ratingsBySlug[p.srID];
					if (!allRatings) {
						continue;
					}

					// Pick a random row of ratings, not draft prospect ratings (the first one)
					ratingsToApply = choice(allRatings.slice(1));
					if (!ratingsToApply) {
						// Must just be a draft prospect
						continue;
					}
				}

				if (!p || !ratingsToApply) {
					// Ran out of players?
					break;
				}

				p.tid = tid;

				const existingRatings = p.ratings.at(-1)!;

				// Adjust age
				const diff = season - ratingsToApply.season;
				p.born.year += diff;
				p.draft.year += diff;

				// Apply ratings
				for (const key of RATINGS) {
					(existingRatings as any)[key] = (ratingsToApply as any)[key];
				}
			}
		}
	}

	// Normalize the size of draft classes, based on the number of teams and the number of expansion teams
	let draftYear = initialDraftYear;
	let draftClassSize = 0;
	const targetDraftClassSize = Math.round(
		(defaultGameAttributes.numDraftRounds * numActiveTeams * 7) / 6,
	);
	for (const p of realPlayers) {
		if (p.tid >= 0) {
			// Skip anyone who was assigned to a team
			continue;
		}

		const diff = draftYear - p.draft.year;
		p.draft.year += diff;
		p.born.year += diff;
		draftClassSize += 1;

		if (draftClassSize >= targetDraftClassSize) {
			draftYear += 1;
			draftClassSize = 0;
		}
	}

	return realPlayers.map((p) => omit(p, ["pid"]));
};

export default initRandomDebutsForRandomPlayersLeague;
