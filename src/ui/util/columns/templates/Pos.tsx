import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) => p.ratings.pos;
