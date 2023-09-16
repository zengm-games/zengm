import range from "lodash-es/range";
import { MAX_SEASON, MIN_SEASON } from ".";

export const SelectSeasonRange = ({
	id,
	seasonRange,
	setters,
}: {
	id: string;
	seasonRange: [number, number];
	setters: [(season: number) => void, (season: number) => void];
}) => {
	const allSeasons = range(MIN_SEASON, MAX_SEASON + 1);

	return (
		<div className="input-group" style={{ width: 180 }}>
			{([0, 1] as const).map(i => {
				return (
					<select
						key={i}
						id={i === 0 ? id : undefined}
						className="form-select"
						value={seasonRange[i]}
						onChange={event => {
							const newSeason = parseInt(event.target.value);

							setters[i](newSeason);

							// Move the other season too if necessary
							if (i === 0) {
								if (newSeason > seasonRange[1]) {
									setters[1](newSeason);
								}
							} else {
								if (newSeason < seasonRange[0]) {
									setters[0](newSeason);
								}
							}
						}}
					>
						{allSeasons.map(season => (
							<option key={season} value={season}>
								{season}
							</option>
						))}
					</select>
				);
			})}
		</div>
	);
};
