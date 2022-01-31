import type { TemplateProps } from "../getCols";

export default ({ p, c, vars }: TemplateProps) => {
	return p.stats.yearsWithTeam.toFixed(1);
};
