import changesBasketball from "./changes.basketball";
import changesFootball from "./changes.football";

const changes =
	process.env.SPORT === "football" ? changesFootball : changesBasketball;

export default changes;
