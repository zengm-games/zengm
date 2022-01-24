import type { Player } from "../../../../common/types";
import { RatingWithChange } from "../../../components";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol, vars: object) => {
	if (vars["challengeNoRatings"]) return "";
	else if (p.ratings["dovr"])
		return (
			<RatingWithChange change={p.ratings["dovr"]}>
				{p.ratings["ovr"]}
			</RatingWithChange>
		);
	else return p.ratings["ovr"];
};
