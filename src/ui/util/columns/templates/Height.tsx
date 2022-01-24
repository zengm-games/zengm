import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";
import { wrappedHeight } from "../../../components/Height";

export default (p: Player, c: MetaCol) => wrappedHeight(p.hgt);
