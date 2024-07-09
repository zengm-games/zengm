import { RATINGS } from ".";

export type FilterCategory = "bio" | "rating";

type AdvancedPlayerSearchField = {
	category: FilterCategory;
	key: string;
	colKey: string;
	valueType: "numeric" | "string";
	getValue: (p: any) => string | number;

	// Used in worker to determine what data to fetch from playersPlus, if it's not just the string value in "key"
	workerFieldOverride?: string;
};

type MinimalAdvancedPlayerSearchField = Omit<
	AdvancedPlayerSearchField,
	"category" | "key"
>;

const ratingOptions: Record<string, MinimalAdvancedPlayerSearchField> = {};
for (const key of ["ovr", "pot", ...RATINGS]) {
	ratingOptions[key] = {
		colKey: key === "ovr" ? "Ovr" : key === "pot" ? "Pot" : `rating:${key}`,
		valueType: "numeric",
		getValue: p => p.ratings[key],
	};
}

const allFiltersTemp: Record<
	FilterCategory,
	{
		label: string;
		options: Record<string, MinimalAdvancedPlayerSearchField>;
	}
> = {
	bio: {
		label: "Bio",
		options: {
			name: {
				colKey: "Name",
				valueType: "string",
				getValue: p => p.name,
			},
			country: {
				colKey: "Country",
				valueType: "string",
				getValue: p => p.born.loc,
				workerFieldOverride: "born",
			},
			college: {
				colKey: "College",
				valueType: "string",
				getValue: p => p.college,
			},
		},
	},
	rating: {
		label: "Ratings",
		options: ratingOptions,
	},
};

// Add key and category to each option
export const allFilters = allFiltersTemp as Record<
	FilterCategory,
	{
		label: string;
		options: Record<string, AdvancedPlayerSearchField>;
	}
>;
for (const [category, { options }] of Object.entries(allFiltersTemp)) {
	for (const [key, value] of Object.entries(options)) {
		(value as any).key = key;
		(value as any).category = category;
	}
}
