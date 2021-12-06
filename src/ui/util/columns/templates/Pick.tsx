import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) =>
	p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : null;
