import { bySport } from "../../common";
import GameSimBaseball from "./GameSim.baseball";
import GameSimBasketball from "./GameSim.basketball";
import GameSimFootball from "./GameSim.football";
import GameSimHockey from "./GameSim.hockey";

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
