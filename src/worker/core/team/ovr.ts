import { bySport } from "../../../common";
import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";
import ovrHockey from "./ovr.hockey";

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
		pos?: string;
		rating?: string;
		wholeRoster?: boolean;
	} = {},
) => {
	return bySport({
		basketball: ovrBasketball(players, {
			rating: options.rating,
		}),
		football: ovrFootball(players, {
			onlyPos: options.pos,
			wholeRoster: options.wholeRoster,
		}),
		hockey: ovrHockey(players as any, {
			onlyPos: options.pos,
		}),
	});
};

export default ovr;
