import type {
	AwardInfoIndividual,
	Awards2,
	PlayerAwardBuiltIn,
} from "../../../../common/types.ts";
import type { AwardByPlayer } from "../../../core/awards/awardsByPlayer.ts";

// This is adapted from getAwardsByPlayer in awardsByPlayer.ts, so it doesn't require any player info besides pid, and so I don't have to worry about this migration code if I ever update the original getAwardsByPlayer

type MyAwardByPlayer = Pick<AwardByPlayer, "pid" | "award">;

export const getNewAwardsByPlayer = (awards: Awards2["awards"]) => {
	const awardsByPlayer: MyAwardByPlayer[] = [];
	for (const [index, award] of awards.entries()) {
		const common: Pick<
			PlayerAwardBuiltIn,
			"group" | "index" | "name" | "shortName"
		> = {
			name: award.name,
			shortName: award.shortName,
			index,
		};

		if (award.group && award.group.type !== "playoffSeries") {
			common.group = award.group;
		}

		if (award.numTeams === undefined) {
			for (const [i, { pid }] of award.winner.entries()) {
				if (pid === undefined) {
					continue;
				}
				const extra: {
					actAs?: AwardInfoIndividual["actAs"];
				} = {};
				if (award.actAs !== undefined) {
					extra.actAs = award.actAs;
				}

				awardsByPlayer.push({
					pid,
					award: {
						...common,
						...extra,
						rank: i + 1, // Rank in "voting"
					},
				});
			}
		} else {
			for (const [i, team] of award.winner.entries()) {
				for (const { pid } of team) {
					if (pid === undefined) {
						continue;
					}
					awardsByPlayer.push({
						pid,
						award: {
							...common,
							rank: i + 1, // Team number
							numTeams: award.numTeams,
						},
					});
				}
			}
		}
	}

	return awardsByPlayer;
};
