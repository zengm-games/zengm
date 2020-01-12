import deionWorker from "../../deion/worker";
import common from "../common";
import GameSim from "./core/GameSim";
import player from "./core/player";
import season from "./core/season";
import team from "./core/team";
import util from "./util";
import views from "./views";
import { Names } from "../../deion/common/types";

// This is dynamically resolved with rollup-plugin-alias
import names from "player-names"; // eslint-disable-line

const init = async () => {
	await deionWorker({
		overrides: {
			common,
			core: {
				GameSim,
				player,
				season,
				team,
			},
			names: (names as unknown) as Names,
			util,
			views,
		},
	});
};

export default init;
