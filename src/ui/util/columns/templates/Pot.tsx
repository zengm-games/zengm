import type { TemplateProps } from "../getCols";
import { RatingWithChange } from "../../../components";

export default ({ p, c, vars }: TemplateProps) => {
	if (vars["challengeNoRatings"]) return "";
	else if (p.ratings["dpot"])
		return (
			<RatingWithChange change={p.ratings["dpot"]}>
				{p.ratings["pot"]}
			</RatingWithChange>
		);
	else return p.ratings["pot"];
};
