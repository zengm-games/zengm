import { Player } from "../../../../common/types";
import { RatingWithChange } from "../../../components";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) =>
	p.ratings["dpot"] ? (
		<RatingWithChange change={p.ratings["dpot"]}>
			{p.ratings["pot"]}
		</RatingWithChange>
	) : (
		p.ratings["pot"]
	);
