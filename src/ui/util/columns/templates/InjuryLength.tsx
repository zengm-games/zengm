import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) => p.injury.gamesRemaining;
