import type { TemplateProps } from "../getCols";
import { PlayerNameLabels } from "../../../components";

export default ({ p, c, vars }: TemplateProps) => (
	<PlayerNameLabels
		pid={p.pid}
		injury={p.injury}
		jerseyNumber={p.jerseyNumber}
		skills={p.ratings.skills}
		watch={p.watch}
		season={vars.season === "career" ? undefined : vars.season}
	>
		{p.name}
	</PlayerNameLabels>
);
