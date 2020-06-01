import GameSimBasketball from "./GameSim.basketball";
import GameSimFootball from "./GameSim.football";

const GameSim =
	process.env.SPORT === "football" ? GameSimFootball : GameSimBasketball;

export default GameSim;
