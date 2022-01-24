import { helpers } from "../../index";
import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) => {
	return (
		<a href={helpers.leagueUrl(["roster", `${p.stats.abbrev}_${p.tid}`])}>
			{p.stats.abbrev}
		</a>
	);
};
