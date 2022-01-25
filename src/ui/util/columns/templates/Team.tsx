import type { TemplateProps } from "../getCols";
import { helpers } from "../../index";

export default ({ p, c, vars }: TemplateProps) => {
	return (
		<a href={helpers.leagueUrl(["roster", `${p.stats.abbrev}_${p.tid}`])}>
			{p.stats.abbrev}
		</a>
	);
};
