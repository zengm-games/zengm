import { bySport } from "../../../common/index.ts";
import playThroughInjuriesFactor from "../../../common/playThroughInjuriesFactor.ts";
import type { PlayerInjury } from "../../../common/types.ts";
import ovrBaseball from "./ovr.baseball.ts";
import ovrBasketball from "./ovr.basketball.ts";
import ovrFootball from "./ovr.football.ts";
import ovrHockey from "./ovr.hockey.ts";

// pos is used for position-specific rankings
// wholeRoster=true is used for computing team value of the whole roster, like for determining who to draft or sign
const ovr = (
	players: {
		injury: PlayerInjury;
		pid: number | undefined;
		ratings: {
			ovr: number;
			ovrs: Record<string, number> | undefined;
			pos: string;
		};
		value: number;
	}[],
	options: {
		// When defined, only healthy players and players playing through injury are included
		accountForInjuredPlayers?: {
			numDaysInFuture: number;
			playThroughInjuries: [number, number];
		};
		onlyPos?: string;
		playoffs?: boolean;
		rating?: string;
		wholeRoster?: boolean;
	} = {},
) => {
	let players2;
	if (options.accountForInjuredPlayers) {
		const { numDaysInFuture, playThroughInjuries } =
			options.accountForInjuredPlayers;
		const currentPlayThroughInjuries =
			playThroughInjuries[options.playoffs ? 1 : 0];

		players2 = [];
		for (const p of players) {
			const gamesRemaining = p.injury.gamesRemaining - numDaysInFuture;
			if (gamesRemaining <= 0) {
				players2.push(p);
			} else if (gamesRemaining <= currentPlayThroughInjuries) {
				// Adjust for playing through injury
				const injuryFactor = playThroughInjuriesFactor(gamesRemaining);
				const p2 = { ...p };
				p2.ratings = { ...p2.ratings };
				p2.ratings.ovr *= injuryFactor;
				if (p2.ratings.ovrs) {
					for (const key of Object.keys(p2.ratings.ovrs)) {
						p2.ratings.ovrs[key]! *= injuryFactor;
					}
				}
				players2.push(p2);
			}
		}
	} else {
		players2 = players;
	}

	return bySport<(players: any, options: any) => number>({
		baseball: ovrBaseball,
		basketball: ovrBasketball,
		football: ovrFootball,
		hockey: ovrHockey,
	})(players2, options);
};

export default ovr;
