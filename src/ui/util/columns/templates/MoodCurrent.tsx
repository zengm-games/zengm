import type { Player } from "../../../../common/types";
import { dataTableWrappedMood } from "../../../components/Mood";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) =>
	dataTableWrappedMood({ defaultType: "current", maxWidth: true, p });
