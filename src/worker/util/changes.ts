import { bySport } from "../../common";
import changesBasketball from "./changes.basketball";
import changesFootball from "./changes.football";

const changes = bySport({
	basketball: changesBasketball,
	football: changesFootball,
});

export default changes;
