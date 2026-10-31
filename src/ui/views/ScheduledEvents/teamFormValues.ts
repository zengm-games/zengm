import {
	DEFAULT_JERSEY,
	DEFAULT_TEAM_COLORS,
} from "../../../common/constants.ts";

// Same format that TeamForm uses
export type TeamFormValues = {
	abbrev: string;
	colors: [string, string, string];
	did: string;
	imgURL: string;
	imgURLSmall: string;
	jersey: string;
	name: string;
	pop: string;
	region: string;
	stadiumCapacity: string;
};

// Convert from the format in a scheduled event or team object to the format used by TeamForm
export const getTeamFormValues = (
	t: Partial<Record<keyof TeamFormValues, unknown>>,
	defaults: {
		did: string;
		stadiumCapacity: number;
	},
): TeamFormValues => {
	return {
		abbrev: String(t.abbrev ?? ""),
		colors: (t.colors as TeamFormValues["colors"]) ?? DEFAULT_TEAM_COLORS,
		did: String(t.did ?? defaults.did),
		imgURL: String(t.imgURL ?? ""),
		imgURLSmall: String(t.imgURLSmall ?? ""),
		jersey: String(t.jersey ?? DEFAULT_JERSEY),
		name: String(t.name ?? ""),
		pop: String(t.pop ?? 1),
		region: String(t.region ?? ""),
		stadiumCapacity: String(t.stadiumCapacity ?? defaults.stadiumCapacity),
	};
};

// Apply a change from TeamForm's handleInputChange, which uses the fields colors0/colors1/colors2 for the three colors
export const setTeamFormValue = (
	values: TeamFormValues,
	field: string,
	value: string,
): TeamFormValues => {
	if (field.startsWith("colors")) {
		const i = Number.parseInt(field.replace("colors", ""));
		const colors: TeamFormValues["colors"] = [...values.colors];
		colors[i] = value;
		return {
			...values,
			colors,
		};
	}

	return {
		...values,
		[field]: value,
	};
};
