import { TIME_BETWEEN_GAMES } from "./constants";
import helpers from "./helpers";

const timeBetweenGames = (numGames: number) => {
	return helpers.plural(TIME_BETWEEN_GAMES, numGames);
};

export default timeBetweenGames;
