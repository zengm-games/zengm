import { bySport } from "../../../common";
import type { Player, Team } from "../../../common/types";
import type { Position } from "../../../common/types.football";
import genDepthBaseball from "./genDepth.baseball";
import genDepthFootball from "./genDepth.football";
import genDepthHockey from "./genDepth.hockey";

const genDepth = async (
	players: Player[],
	initialDepth?: Team["depth"],
	onlyNewPlayers?: boolean,
	pos?: "L" | "LP" | "D" | "DP" | "P" | Position | "F" | "D" | "G",
) => {
	if (!initialDepth) {
		initialDepth = bySport({
			baseball: {
				L: [],
				LP: [],
				D: [],
				DP: [],
				P: [],
			},
			basketball: undefined,
			football: {
				QB: [],
				RB: [],
				WR: [],
				TE: [],
				OL: [],
				DL: [],
				LB: [],
				CB: [],
				S: [],
				K: [],
				P: [],
				KR: [],
				PR: [],
			},
			hockey: {
				F: [],
				D: [],
				G: [],
			},
		});
	}

	const depth = (await bySport({
		baseball: genDepthBaseball,
		basketball: undefined as any,
		football: genDepthFootball,
		hockey: genDepthHockey,
	})?.(
		players,
		initialDepth as any,
		onlyNewPlayers,
		pos as any,
	)) as Team["depth"];

	return depth;
};

export default genDepth;
