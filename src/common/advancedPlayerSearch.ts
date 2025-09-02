import { isSport, PLAYER_STATS_TABLES, RATINGS } from "./index.ts";
import type { Col } from "../ui/components/DataTable/index.tsx";

type AdvancedPlayerSearchField = {
	category: string;
	key: string;
	colKey: string;
	colOverrides?: Partial<Col>;
	valueType: "numeric" | "string";
	getValue: (
		p: any,
		singleSeason: "totals" | "singleSeason",
	) => string | number;

	// Used in worker to determine what data to fetch from playersPlus, if it's not just the string value in "key".
	// null means don't fetch anything.
	workerFieldOverride?: string | null;
};

type MinimalAdvancedPlayerSearchField = Omit<
	AdvancedPlayerSearchField,
	"category" | "key"
>;

export const addPrefixForStat = (statType: string, stat: string) => {
	if (statType === "ratings") {
		if (stat === "ovr") {
			return "Ovr";
		}
		if (stat === "pot") {
			return "Pot";
		}
		return `rating:${stat}`;
	} else if (statType === "bio") {
		if (stat === "age") {
			return "Age";
		}
		if (stat === "draftPosition") {
			return "Draft Pick";
		}
		if (stat === "salary") {
			return "Salary";
		}
	}
	return `stat:${stat.endsWith("Max") ? stat.replace("Max", "") : stat}`;
};

const ratingOptions: Record<string, MinimalAdvancedPlayerSearchField> = {};
for (const key of ["ovr", "pot", ...RATINGS]) {
	ratingOptions[key] = {
		colKey: addPrefixForStat("ratings", key),
		valueType: "numeric",
		getValue: (p) => p.ratings[key],
	};
}

const allFiltersTemp: Record<
	string,
	{
		options: Record<string, MinimalAdvancedPlayerSearchField>;
	}
> = {
	bio: {
		options: {
			name: {
				colKey: "Name",
				valueType: "string",
				getValue: (p) => p.name,
			},
			pos: {
				colKey: "Pos",
				valueType: "string",
				getValue: (p) => p.ratings.pos,
				workerFieldOverride: null,
			},
			abbrev: {
				colKey: "Team",
				valueType: "string",
				getValue: (p) => p.abbrev,
			},
			age: {
				colKey: "Age",
				valueType: "numeric",
				getValue: (p, singleSeason) => {
					if (singleSeason === "totals") {
						return p.ageAtDeath ?? p.age;
					}

					return p.age;
				},
			},
			jerseyNumber: {
				colKey: "stat:jerseyNumber",
				valueType: "string",
				getValue: (p) => p.stats?.jerseyNumber ?? "",
				workerFieldOverride: null,
			},
			contract: {
				colKey: "Contract",
				valueType: "numeric",
				getValue: (p) => p.contract.amount,
				colOverrides: {
					desc: "Amount, Millions of Dollars",
				},
			},
			exp: {
				colKey: "Exp",
				valueType: "numeric",
				getValue: (p) => p.contract.exp,
				workerFieldOverride: "contract",
			},
			college: {
				colKey: "College",
				valueType: "string",
				getValue: (p) => p.college,
			},
			country: {
				colKey: "Country",
				valueType: "string",
				getValue: (p) => p.born.loc,
				workerFieldOverride: "born",
			},
			draftYear: {
				colKey: "Draft Year",
				valueType: "numeric",
				getValue: (p) => p.draft.year,
				workerFieldOverride: "draft",
			},
			draftRound: {
				colKey: "Draft Round",
				valueType: "numeric",
				getValue: (p) => p.draft.round,
				workerFieldOverride: "draft",
			},
			draftPick: {
				colKey: "Draft Pick",
				valueType: "numeric",
				getValue: (p) => p.draft.pick,
				workerFieldOverride: "draft",
			},
			experience: {
				colKey: "Experience",
				valueType: "numeric",
				getValue: (p) => p.experience,
			},
		},
	},
	ratings: {
		options: ratingOptions,
	},
};

const processStatsTable = (
	statsTable: (typeof PLAYER_STATS_TABLES)[string],
) => {
	if (isSport("football")) {
		const index = statsTable.stats.indexOf("qbRec");
		if (index >= 0) {
			const stats = [...statsTable.stats];
			stats.splice(index, 1, "qbW", "qbL", "qbT", "qbOTL");
			return {
				...statsTable,
				stats,
			};
		}
	}
	if (isSport("hockey")) {
		const index = statsTable.stats.indexOf("gRec");
		if (index >= 0) {
			const stats = [...statsTable.stats];
			stats.splice(index, 1, "gW", "gL", "gT", "gOTL");
			return {
				...statsTable,
				stats,
			};
		}
	}

	return statsTable;
};

for (const [category, table] of Object.entries(PLAYER_STATS_TABLES)) {
	const options: Record<string, MinimalAdvancedPlayerSearchField> = {};
	const processedTable = processStatsTable(table);
	for (const key of processedTable.stats) {
		options[key] = {
			colKey: addPrefixForStat(category, key),
			valueType: "numeric",
			getValue:
				category === "gameHighs"
					? (p) => {
							const stat = p.stats[key];
							return Array.isArray(stat) ? stat[0] : stat;
						}
					: (p) => p.stats[key],
		};
	}

	allFiltersTemp[category] = {
		options,
	};
}

// Add key and category to each option
export const allFilters = allFiltersTemp as Record<
	string,
	{
		options: Record<string, AdvancedPlayerSearchField>;
	}
>;
for (const [category, { options }] of Object.entries(allFiltersTemp)) {
	for (const [key, value] of Object.entries(options)) {
		(value as any).key = key;
		(value as any).category = category;
	}
}

export const getStatsTableByType = (statTypePlus: string) => {
	if (statTypePlus == "bio" || statTypePlus == "ratings") {
		return;
	}

	// Keep in sync with statTypesAdv
	let table;
	if (isSport("basketball")) {
		if (statTypePlus === "advanced") {
			table = PLAYER_STATS_TABLES.advanced!;
		} else if (statTypePlus === "shotLocations") {
			table = PLAYER_STATS_TABLES.shotLocations!;
		} else if (statTypePlus === "gameHighs") {
			table = PLAYER_STATS_TABLES.gameHighs!;
		} else {
			table = PLAYER_STATS_TABLES.regular!;
		}
	} else {
		table = PLAYER_STATS_TABLES[statTypePlus]!;
	}

	return processStatsTable(table);
};

export const getStats = (statTypePlus: string) => {
	if (statTypePlus === "ratings") {
		return ["ovr", "pot", ...RATINGS];
	} else if (statTypePlus == "bio") {
		return ["age", "salary", "draftPosition"];
	} else {
		const statsTable = getStatsTableByType(statTypePlus);
		if (!statsTable) {
			throw new Error(`Invalid statType: "${statTypePlus}"`);
		}

		// Remove pos for fielding stats
		if (isSport("baseball")) {
			return statsTable.stats.filter((stat) => stat !== "pos");
		}

		return [...statsTable.stats];
	}
};

export const getExtraStatTypeKeys = (
	showStatTypes: string[],
	applyWorkerFieldOverrides?: boolean,
) => {
	const attrs = [];
	const ratings = [];
	const stats = [];

	for (const statType of showStatTypes) {
		if (statType === "bio") {
			for (const [key, info] of Object.entries(allFilters.bio!.options)) {
				if (key === "jerseyNumber") {
					// Already shown by player name
					continue;
				}

				if (
					applyWorkerFieldOverrides &&
					info.workerFieldOverride !== undefined
				) {
					if (info.workerFieldOverride !== null) {
						attrs.push(info.workerFieldOverride);
					}
				} else {
					attrs.push(key);
				}
			}
		} else if (statType === "ratings") {
			ratings.push(...RATINGS);
		} else {
			stats.push(...getStats(statType));
		}
	}

	return {
		attrs,
		ratings,
		stats,
	};
};
