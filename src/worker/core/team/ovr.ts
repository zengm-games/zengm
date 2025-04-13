import { bySport } from "../../../common/index.ts";
import ovrBaseball from "./ovr.baseball.ts";
import ovrBasketball from "./ovr.basketball.ts";
import ovrFootball from "./ovr.football.ts";
import ovrHockey from "./ovr.hockey.ts";

// pos is used for position-specific rankings
// wholeRoster=true is used for computing team value of the whole roster, like for determining who to draft or sign
const ovr = (
	players: {
		pid: number | undefined;
		value: number;
		ratings: {
			ovr: number;
			ovrs: Record<string, number> | undefined;
			pos: string;
		};
	}[],
	options: {
		onlyPos?: string;
		playoffs?: boolean;
		rating?: string;
		wholeRoster?: boolean;
	} = {},
) => {
	return bySport<(players: any, options: any) => number>({
		baseball: ovrBaseball,
		basketball: ovrBasketball,
		football: ovrFootball,
		hockey: ovrHockey,
	})(players, options);
};

export default ovr;
