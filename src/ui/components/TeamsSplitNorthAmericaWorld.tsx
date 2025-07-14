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
			throw new Error(`Unknown region ${t.region}`);
		}

		return continent;
	});

	return continents.map((continent) => {
		const continentTeams = teamsByContinent[continent];

		if (!continentTeams) {
			return null;
		}

		return (
			<optgroup key={continent} label={continent}>
				{continentTeams.map((t, i) => option(t, i))}
			</optgroup>
		);
	});
};
