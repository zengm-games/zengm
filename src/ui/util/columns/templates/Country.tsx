import type { TemplateProps } from "../getCols";
import { helpers } from "../../index";
import { CountryFlag } from "../../../components";

export default ({ p, c, vars }: TemplateProps) => (
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
