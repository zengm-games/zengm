import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";
import { helpers } from "../../index";

export default (p: Player, c: MetaCol) => {
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
