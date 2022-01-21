import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";
import { wrappedWeight } from "../../../components/Weight";

export default (p: Player, c: ColTemp) => wrappedWeight(p.weight);
