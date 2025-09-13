import clsx from "clsx";
import { range } from "../../../common/utils.ts";
import { REAL_PLAYERS_INFO } from "../../../common/constants.ts";

export const SelectSeasonRange = ({
	className,
	id,
	disabled,
	seasonRange,
	setters,
}: {
	className?: string;
	id?: string;
	disabled?: boolean;
	seasonRange: [number, number];
	setters: [(season: number) => void, (season: number) => void];
}) => {
	const allSeasons = REAL_PLAYERS_INFO
		? range(REAL_PLAYERS_INFO.MIN_SEASON, REAL_PLAYERS_INFO.MAX_SEASON + 1)
		: [];

	return (
		<div className={clsx("input-group", className)} style={{ width: 180 }}>
			{([0, 1] as const).map((i) => {
				return (
					<select
						key={i}
						id={i === 0 ? id : undefined}
						className="form-select"
						disabled={disabled}
						value={seasonRange[i]}
						onChange={(event) => {
							const newSeason = Number.parseInt(event.target.value);

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
						{allSeasons.map((season) => (
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
