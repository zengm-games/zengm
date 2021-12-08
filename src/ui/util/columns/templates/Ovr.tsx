import type { Player } from "../../../../common/types";
import { RatingWithChange } from "../../../components";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp, vars: object) => {
	if (vars["challengeNoRatings"]) return "";
	else if (p.ratings["dovr"])
		return (
			<RatingWithChange change={p.ratings["dovr"]}>
				{p.ratings["ovr"]}
			</RatingWithChange>
		);
	else return p.ratings["ovr"];
};
