import { PHASE, timeBetweenGames } from "../../../common/index.ts";
import { g } from "../../util/index.ts";
import type { Player, PlayerWithoutKey } from "../../../common/types.ts";

const isUntradable = (
	p: Player | PlayerWithoutKey,
):
	| {
			untradable: false;
			untradableMsg?: string;
	  }
	| {
			untradable: true;
			untradableMsg: string;
	  } => {
	if (!g.get("godMode")) {
		if (
			p.contract.exp <= g.get("season") &&
			g.get("phase") > PHASE.PLAYOFFS &&
			g.get("phase") < PHASE.FREE_AGENCY
		) {
			// If the season is over, can't trade players whose contracts are expired
			return {
				untradable: true,
				untradableMsg: "Cannot trade expired contracts",
			};
		}

		if (p.gamesUntilTradable > 0) {
			// Can't trade players who recently were signed or traded
			return {
				untradable: true,
				untradableMsg: `Cannot trade recently-acquired player for ${
					p.gamesUntilTradable
				} more ${timeBetweenGames(p.gamesUntilTradable)}`,
			};
		}
	}

	return {
		untradable: false,
	};
};

export default isUntradable;
