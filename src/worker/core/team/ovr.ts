import { bySport } from "../../../common";
import ovrBaseball from "./ovr.baseball";
import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import ovrHockey from "./ovr.hockey";

// pos is used for position-specific rankings
// wholeRoster=true is used for computing team value of the whole roster, like for determining who to draft or sign
const ovr = (
	players: {
		pid?: number;
		value: number;
		ratings:
			| {
					ovr: number;
					ovrs?: Record<string, number>;
					pos: string;
			  }
			| {
					fuzz: number;
					ovr: number;
					ovrs?: Record<string, number>;
					pos: string;
			  }[];
	}[],
	options: {
		fast?: boolean;
		playoffs?: boolean;
		pos?: string;
		rating?: string;
		wholeRoster?: boolean;
	} = {},
) => {
	return bySport({
		baseball: ovrBaseball(players as any, {
			fast: options.fast,
			onlyPos: options.pos,
			wholeRoster: options.wholeRoster,
		}),
		basketball: ovrBasketball(players, {
			playoffs: options.playoffs,
			rating: options.rating,
		}),
		football: ovrFootball(players as any, {
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
