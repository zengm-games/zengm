import { bySport } from "../../../common";
import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import ovrHockey from "./ovr.hockey";

// pos is used for position-specific rankings
// wholeRoster=true is used for computing team value of the whole roster, like for determining who to draft or sign
const ovr = (
	players: {
		value: number;
		ratings: {
			ovr: number;
			ovrs: Record<string, number> | undefined;
			pos: string;
		};
	}[],
	options: {
		playoffs?: boolean;
		pos?: string;
		rating?: string;
		wholeRoster?: boolean;
	} = {},
) => {
	return bySport({
		basketball: ovrBasketball(players, {
			playoffs: options.playoffs,
			rating: options.rating,
		}),
		football: ovrFootball(players, {
			onlyPos: options.pos,
			wholeRoster: options.wholeRoster,
		}),
		hockey: ovrHockey(players as any, {
			onlyPos: options.pos,
			wholeRoster: options.wholeRoster,
		}),
	});
};

export default ovr;
