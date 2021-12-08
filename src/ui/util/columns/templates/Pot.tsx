import type { Player } from "../../../../common/types";
import { RatingWithChange } from "../../../components";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp, vars: object) => {
	if (vars["challengeNoRatings"]) return "";
	else if (p.ratings["dpot"])
		return (
			<RatingWithChange change={p.ratings["dpot"]}>
				{p.ratings["pot"]}
			</RatingWithChange>
		);
	else return p.ratings["pot"];
};
