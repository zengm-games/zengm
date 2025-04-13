import { bySport } from "../../common/index.ts";
import GameSimBaseball from "./GameSim.baseball/index.ts";
import GameSimBasketball from "./GameSim.basketball/index.ts";
import GameSimFootball from "./GameSim.football/index.ts";
import GameSimHockey from "./GameSim.hockey/index.ts";

const GameSim = bySport<
	| typeof GameSimBaseball
	| typeof GameSimFootball
	| typeof GameSimBasketball
	| typeof GameSimHockey
>({
	baseball: GameSimBaseball,
	basketball: GameSimBasketball,
	football: GameSimFootball,
	hockey: GameSimHockey,
});

export default GameSim;
