import { helpers } from "../../index";
import { Player } from "../../../../common/types";
import type { ColTemp } from "../getCols";

export default (p: Player, c: ColTemp) => {
	return (
		<a href={helpers.leagueUrl(["roster", `${p.stats.abbrev}_${p.tid}`])}>
			{p.stats.abbrev}
		</a>
	);
};
