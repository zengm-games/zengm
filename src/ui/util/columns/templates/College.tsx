import type { TemplateProps } from "../getCols";
import { helpers } from "../../index";

export default ({ p, c, vars }: TemplateProps) => {
	const college = p.college && p.college !== "" ? p.college : "None";
	return (
		<a
			href={helpers.leagueUrl([
				"frivolities",
				"most",
				"college",
				window.encodeURIComponent(college),
			])}
		>
			{college}
		</a>
	);
};
