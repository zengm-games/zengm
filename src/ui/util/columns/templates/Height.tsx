import type { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";
import { wrappedHeight } from "../../../components/Height";

export default (p: Player, c: ColTemp) => wrappedHeight(p.hgt);
