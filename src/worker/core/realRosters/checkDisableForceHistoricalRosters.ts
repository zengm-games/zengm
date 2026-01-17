import { PHASE, REAL_PLAYERS_INFO } from "../../../common/constants.ts";
import g from "../../util/g.ts";
import league from "../league/index.ts";

export const checkDisableForceHistoricalRosters = async (
	season: number,
	phase: (typeof PHASE)["PRESEASON"] | (typeof PHASE)["PLAYOFFS"],
) => {
	if (g.get("forceHistoricalRosters") && REAL_PLAYERS_INFO) {
		if (season >= REAL_PLAYERS_INFO.MAX_SEASON) {
			// If MAX_PHASE is not yet the playoffs, then disable at the preseason because we don't know the final rosters yet, so might as well let it play out with roster moves. If MAX_PHASE is at the playoffs or beyond, then disable when we reach the playoffs, so that all the offseason stuff can run this season.
			if (
				REAL_PLAYERS_INFO.MAX_PHASE <= PHASE.REGULAR_SEASON ||
				phase > PHASE.REGULAR_SEASON
			) {
				await league.setGameAttributes({
					forceHistoricalRosters: false,
				});
			}
		}
	}
};
