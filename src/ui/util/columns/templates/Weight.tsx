import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";
import { wrappedWeight } from "../../../components/Weight";

export default (p: Player, c: MetaCol) => wrappedWeight(p.weight);
