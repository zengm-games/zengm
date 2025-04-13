import { TIME_BETWEEN_GAMES } from "./constants.ts";
import helpers from "./helpers.ts";

const timeBetweenGames = (numGames: number) => {
	return helpers.plural(TIME_BETWEEN_GAMES, numGames);
};

export default timeBetweenGames;
