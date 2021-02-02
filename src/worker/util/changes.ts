import { bySport } from "../../common";
import changesBasketball from "./changes.basketball";
import changesFootball from "./changes.football";
import changesHockey from "./changes.hockey";

const changes = bySport({
	basketball: changesBasketball,
	football: changesFootball,
	hockey: changesHockey,
});

export default changes;
