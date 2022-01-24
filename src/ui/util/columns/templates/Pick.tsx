import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) =>
	p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : null;
