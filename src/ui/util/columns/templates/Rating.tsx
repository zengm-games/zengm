import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => {
	if (vars["challengeNoRatings"]) return "";
	const key = c.ratings[0] ?? false;
	return key && key in p.ratings ? p.ratings[key].toString() : "";
};
