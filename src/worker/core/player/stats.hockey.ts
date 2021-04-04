// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [
		// Shutouts
		"so",

		// Goals created and point shares
		"gc",
		"ops",
		"dps",
		"gps",
	] as const,
	raw: [
		"gp",
		"gpSkater",
		"gpGoalie",
		"gs",
		"min",
		"ppMin",
		"shMin",
		"minAvailable",
		"pm",
		"pim",

		// Goals and assists: even strength, power play, short-handed, and game-winning
		"evG",
		"ppG",
		"shG",
		"gwG",
		"evA",
		"ppA",
		"shA",
		"gwA",

		// Shots on goal and attempted
		"s",
		"tsa",

		// Faceoffs
		"fow",
		"fol",

		// Blocks
		"blk",

		// Hits
		"hit",

		// Takeaways and giveaways
		"tk",
		"gv",

		// Goals against
		"ga",

		// Saves
		"sv",

		"gW",
		"gL",
		"gT",
		"gOTL",
	] as const,
	max: [
		"minMax",
		"ppMinMax",
		"shMinMax",
		"pmMax",
		"pimMax",
		"evGMax",
		"ppGMax",
		"shGMax",
		"evAMax",
		"ppAMax",
		"shAMax",
		"sMax",
		"tsaMax",
		"fowMax",
		"folMax",
		"blkMax",
		"hitMax",
		"tkMax",
		"gvMax",
		"gaMax",
		"svMax",
		"gMax",
		"aMax",
	] as const,
};

export default stats;
