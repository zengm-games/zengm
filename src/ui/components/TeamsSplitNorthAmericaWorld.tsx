import type { ReactNode } from "react";
import geographicCoordinates, {
	continents,
} from "../../common/geographicCoordinates.ts";
import { groupBy } from "../../common/utils.ts";

export const TeamsSplitNorthAmericaWorld = <
	T extends {
		region: string;
	},
>({
	teams,
	option,
}: {
	teams: T[];
	option: (t: T, i: number) => ReactNode;
}) => {
	const teamsByContinent = groupBy(teams, (t) => {
		const continent = geographicCoordinates[t.region]?.continent;
		if (continent === undefined) {
			return "Unknown";
		}

		return continent;
	});

	// Needed because the i in option is referring to the original teams array
	const indexes = new Map<T, number>();
	for (const [i, t] of teams.entries()) {
		indexes.set(t, i);
	}

	return continents.map((continent) => {
		const continentTeams = teamsByContinent[continent];

		if (!continentTeams) {
			return null;
		}

		return (
			<optgroup key={continent} label={continent}>
				{continentTeams.map((t) => option(t, indexes.get(t)!))}
			</optgroup>
		);
	});
};
