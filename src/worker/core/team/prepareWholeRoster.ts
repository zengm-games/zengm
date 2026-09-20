import { bySport } from "../../../common/sportFunctions.ts";
import ovrBaseball from "./ovr.baseball.ts";
import ovrFootball from "./ovr.football.ts";
import ovrHockey from "./ovr.hockey.ts";

const prepareWholeRoster = (players: Parameters<typeof ovrBaseball>[0]) =>
	bySport({
		baseball: ovrBaseball.prepareWholeRoster,
		basketball: () => undefined,
		football: ovrFootball.prepareWholeRoster,
		hockey: ovrHockey.prepareWholeRoster,
	})(players);

export default prepareWholeRoster;
