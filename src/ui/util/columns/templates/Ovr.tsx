import { RatingWithChange } from "../../../components";
import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => {
	if (vars["challengeNoRatings"]) return "";
	else if (p.ratings["dovr"] && vars.phase === 0)
		return (
			<RatingWithChange change={p.ratings["dovr"]}>
				{p.ratings["ovr"]}
			</RatingWithChange>
		);
	else return p.ratings["ovr"];
};
