const teamAndOpp = [
	"fg",
	"fga",
	"fgAtRim",
	"fgaAtRim",
	"fgLowPost",
	"fgaLowPost",
	"fgMidRange",
	"fgaMidRange",
	"tp",
	"tpa",
	"ft",
	"fta",
	"orb",
	"drb",
	"ast",
	"tov",
	"stl",
	"blk",
	"pf",
	"pts",
	"dd",
	"td",
	"qd",
	"fxf",

	// KEEP THIS IN SYCN WITH ABOVE! TypeScript needs them to be listed explicitly. Used to be:
	// ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
	"oppFg",
	"oppFga",
	"oppFgAtRim",
	"oppFgaAtRim",
	"oppFgLowPost",
	"oppFgaLowPost",
	"oppFgMidRange",
	"oppFgaMidRange",
	"oppTp",
	"oppTpa",
	"oppFt",
	"oppFta",
	"oppOrb",
	"oppDrb",
	"oppAst",
	"oppTov",
	"oppStl",
	"oppBlk",
	"oppPf",
	"oppPts",
	"oppDd",
	"oppTd",
	"oppQd",
	"oppFxf",
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [],
	raw: ["gp", "min", "ba", ...teamAndOpp] as const,
};

export default stats;
