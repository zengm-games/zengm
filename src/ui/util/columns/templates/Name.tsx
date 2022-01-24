import type { Player } from "../../../../common/types";
import { PlayerNameLabels } from "../../../components";
import type { MetaCol } from "../getCols";

export default (p: Player, c: MetaCol) => (
	<PlayerNameLabels
		pid={p.pid}
		injury={p.injury}
		jerseyNumber={p.jerseyNumber}
		skills={p.ratings.skills}
		watch={p.watch}
	>
		{p.name}
	</PlayerNameLabels>
);
