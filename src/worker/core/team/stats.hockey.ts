const teamAndOpp = [
	"pts",
	"pim",
	"evG",
	"ppG",
	"shG",
	"evA",
	"ppA",
	"shA",
	"s",
	"tsa",
	"fow",
	"fol",
	"blk",
	"hit",
	"tk",
	"gv",
	"sv",
	"ppo",

	// KEEP THIS IN SYCN WITH ABOVE! TypeScript needs them to be listed explicitly. Used to be:
	// ...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
	"oppPts",
	"oppPim",
	"oppEvG",
	"oppPpG",
	"oppShG",
	"oppEvA",
	"oppPpA",
	"oppShA",
	"oppS",
	"oppTsa",
	"oppFow",
	"oppFol",
	"oppBlk",
	"oppHit",
	"oppTk",
	"oppGv",
	"oppSv",
	"oppPpo",
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: ["so", "oppQs", "oppRbs", "oppSo"],
	raw: ["gp", "min", ...teamAndOpp] as const,
};

export default stats;
