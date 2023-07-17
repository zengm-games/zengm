import type { ReactNode } from "react";
import geographicCoordinates from "../../common/geographicCoordinates";

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
	const teamsNorthAmerica = [];
	const teamsWorld = [];
	for (let i = 0; i < teams.length; i++) {
		const t = teams[i];
		if (geographicCoordinates[t.region]?.outsideNorthAmerica) {
			teamsWorld.push({
				i,
				t,
			});
		} else {
			teamsNorthAmerica.push({
				i,
				t,
			});
		}
	}

	return (
		<>
			<optgroup label="North America">
				{teamsNorthAmerica.map(({ t, i }) => option(t, i))}
			</optgroup>
			<optgroup label="World">
				{teamsWorld.map(({ t, i }) => option(t, i))}
			</optgroup>
		</>
	);
};
