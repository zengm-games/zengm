import { REAL_PLAYERS_INFO } from "../../common/constants.ts";
import { g, local } from "../util/index.ts";
import { getRealTeamInfo } from "./newLeague.ts";

const updateEightyTwoZeroDraft = async () => {
	const draft = local.eightyTwoZeroDraft;

	return {
		godMode: g.get("godMode"),
		loading: false,
		realTeamInfo: await getRealTeamInfo(),
		realPlayers: REAL_PLAYERS_INFO !== undefined,
		started: draft !== undefined,
		...(draft ?? {
			currentTeam: undefined,
			picks: [],
			round: 1,
		}),
	};
};

export default updateEightyTwoZeroDraft;
