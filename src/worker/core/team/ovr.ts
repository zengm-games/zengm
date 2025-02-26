import { bySport } from "../../../common";
import ovrBaseball from "./ovr.baseball";
import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import ovrHockey from "./ovr.hockey";

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
