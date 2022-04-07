import { helpers } from "../../util";
import { fielding } from "../player/stats.baseball";

const teamAndOpp = [
	// Batting
	"pts",
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

	// Fielding
	...fielding,

	// Pitching
	"w",
	"l",
	"gpPit",
	"gsPit",
	"gf",
	"cg",
	"sho",
	"sv",
	"ip",
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
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [],
	raw: [
		"gp",
		"min",
		...teamAndOpp,
		...teamAndOpp.map(stat => `opp${helpers.upperCaseFirstLetter(stat)}`),
	] as const,
};

export default stats;
