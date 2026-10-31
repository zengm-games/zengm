import type { View } from "../../../common/types.ts";
import { ChampionshipBanner } from "../../components/ChampionshipBanner.tsx";
import HideableSection from "../../components/HideableSection.tsx";
import { helpers } from "../../util/helpers.ts";

export const Championships = ({
	history,
}: Pick<View<"teamHistory">, "history">) => {
	const championshipRows = history.filter(
		(row) => row.playoffRoundsWon === row.numPlayoffRounds,
	);

	const count = championshipRows.length;

	return (
		<HideableSection
			title={helpers.plural(`${count} Championship`, count)}
			titleKeyOverride="Championships"
		>
			{count === 0 ? (
				<p>None</p>
			) : (
				<div className="d-flex gap-2 overflow-auto mb-3">
					{championshipRows.map((row) => {
						return (
							<a
								href={helpers.leagueUrl([
									"roster",
									`${row.abbrev}_${row.tid}`,
									row.season,
								])}
								key={row.season}
							>
								<ChampionshipBanner
									className="flex-shrink-0"
									hideRope
									hideText
									season={row.season}
									style={{ width: 90 }}
									t={{
										colors: row.colors,
										imgURLSmall: row.imgURLSmall,
									}}
								/>
							</a>
						);
					})}
				</div>
			)}
		</HideableSection>
	);
};
