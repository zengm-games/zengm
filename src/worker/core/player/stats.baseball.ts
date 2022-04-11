// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [] as const,
	raw: [
		// Batting
		"gp", // Also given to pitcher, since it's displayed various places
		"gs", // Also given to pitcher, since it's displayed various places
		"pa",
		"r",
		"h",
		"2b",
		"3b",
		"hr",
		"rbi",
		"sb",
		"cs",
		"bb",
		"so",
		"gdp",
		"hbp",
		"sh",
		"sf",
		"ibb",

		// Pitching
		"w",
		"l",
		"gpPit",
		"gsPit",
		"gf",
		"cg",
		"sho",
		"sv",
		"outs", // Easier than tracking IP
		"rPit",
		"er",
		"hPit",
		"2bPit",
		"3bPit",
		"hrPit",
		"bbPit",
		"soPit",
		"ibbPit",
		"hbpPit",
		"shPit",
		"sfPit",
		"bk",
		"wp",
		"bf",
		"pc",
	] as const,
	max: [
		// Batting
		"paMax",
		"rMax",
		"hMax",
		"2bMax",
		"3bMax",
		"hrMax",
		"rbiMax",
		"sbMax",
		"csMax",
		"bbMax",
		"soMax",
		"gdpMax",
		"hbpMax",
		"shMax",
		"sfMax",
		"ibbMax",

		// Batting derived
		"abMax",
		"tbMax",

		// Pitching
		"rPitMax",
		"erMax",
		"hPitMax",
		"2bPitMax",
		"3bPitMax",
		"hrPitMax",
		"bbPitMax",
		"soPitMax",
		"ibbPitMax",
		"hbpPitMax",
		"shPitMax",
		"sfPitMax",
		"bkMax",
		"wpMax",
		"bfMax",

		// Pitching derived
		"ipMax",
	] as const,
	byPos: [
		"gsF",
		"gF",
		"cgF",
		"outsF",
		"po",
		"a",
		"e",
		"dp",
		"pb",
		"sbF",
		"csF",
	] as const,
};

export default stats;
