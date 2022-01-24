import type { Player } from "../../../../common/types";
import type { MetaCol } from "../getCols";
import { helpers } from "../../index";
import { CountryFlag } from "../../../components";

export default (p: Player, c: MetaCol) => (
	<>
		<a
			href={helpers.leagueUrl([
				"frivolities",
				"most",
				"country",
				window.encodeURIComponent(helpers.getCountry(p.born.loc)),
			])}
		>
			<CountryFlag className="mr-1" country={p.born.loc} />
			{p.born.loc}
		</a>
	</>
);
