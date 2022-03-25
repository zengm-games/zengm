const teamAndOpp = [
	"pts",
	"hr",

	// KEEP THIS IN SYCN WITH ABOVE! TypeScript needs them to be listed explicitly. Used to be:
	// ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
	"oppHr",
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [],
	raw: ["gp", "min", ...teamAndOpp] as const,
};

export default stats;
