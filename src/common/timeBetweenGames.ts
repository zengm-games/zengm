import { TIME_BETWEEN_GAMES } from "./constants";

const timeBetweenGames = (numGames: number) => {
	const plural = numGames !== 1;

	return `${TIME_BETWEEN_GAMES}${plural ? "s" : ""}`;
};

export default timeBetweenGames;
