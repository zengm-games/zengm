import { bySport } from "../../common";
import GameSimBasketball from "./GameSim.basketball";
import GameSimFootball from "./GameSim.football";

const GameSim = bySport<typeof GameSimFootball | typeof GameSimBasketball>({
	basketball: GameSimBasketball,
	football: GameSimFootball,
});

export default GameSim;
