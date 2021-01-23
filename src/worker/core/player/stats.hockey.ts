// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [
		"w",
		"l",
		"t",
		"otl",

		// Quality starts and really bad starts (goalie)
		"qs",
		"rbs",
	] as const,
	raw: [
		"gp",
		"gs",
		"min",
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

		// Shutouts
		"so",
	] as const,
	max: [
		"minMax",
		"pmMax",
		"pimMax",
		"evGMax",
		"ppGMax",
		"shGMax",
		"evAMax",
		"ppAMax",
		"shAMax",
		"sogMax",
		"satMax",
		"fowMax",
		"folMax",
		"blkMax",
		"hitMax",
		"tkMax",
		"gvMax",
		"gaMax",
		"svMax",
		"soMax",
		"gMax",
		"aMax",
	] as const,
};

export default stats;
