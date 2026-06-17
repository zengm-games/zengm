import type { View } from "../../../common/types.ts";
import { ChampionshipBanner } from "../../components/ChampionshipBanner.tsx";

export const Championships = ({
	history,
}: Pick<View<"teamHistory">, "history">) => {
	const championshipRows = history.filter(
		(row) => row.playoffRoundsWon === row.numPlayoffRounds,
	);

	if (championshipRows.length === 0) {
		return <p>None</p>;
	}

	return (
		<div className="d-flex gap-2 mb-3">
			{championshipRows.map((row) => {
				return (
					<ChampionshipBanner
						key={row.season}
						hideRope
						hideText
						season={row.season}
						style={{ width: 90 }}
						t={{
							colors: row.colors,
							imgURLSmall: row.imgURLSmall,
						}}
					/>
				);
			})}
		</div>
	);
};
