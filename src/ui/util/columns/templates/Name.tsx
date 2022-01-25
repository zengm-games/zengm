import type { TemplateProps } from "../getCols";
import { PlayerNameLabels } from "../../../components";

export default ({ p, c, vars }: TemplateProps) => (
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
