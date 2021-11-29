import type { Player } from "../../../../common/types";
import { RatingWithChange } from "../../../components";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) =>
	p.ratings["dovr"] ? (
		<RatingWithChange change={p.ratings["dovr"]}>
			{p.ratings["ovr"]}
		</RatingWithChange>
	) : (
		p.ratings["ovr"]
	);
