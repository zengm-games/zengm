import { bySport } from "../../common";
import GameSimBasketball from "./GameSim.basketball";
import GameSimFootball from "./GameSim.football";
import GameSimHockey from "./GameSim.hockey";

const GameSim = bySport<
	typeof GameSimFootball | typeof GameSimBasketball | typeof GameSimHockey
>({
	basketball: GameSimBasketball,
	football: GameSimFootball,
	hockey: GameSimHockey,
});

export default GameSim;
