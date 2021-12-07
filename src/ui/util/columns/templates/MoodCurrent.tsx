import type { Player } from "../../../../common/types";
import { dataTableWrappedMood } from "../../../components/Mood";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) =>
	dataTableWrappedMood({ defaultType: "current", maxWidth: true, p });
