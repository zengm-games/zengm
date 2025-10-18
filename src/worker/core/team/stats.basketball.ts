import helpers from "../../util/helpers.ts";

const raw = [
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
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: [],
	raw: [
		"gp",
		"min",
		...raw,
		...raw.map((stat) => `opp${helpers.upperCaseFirstLetter(stat)}` as const),
	] as const,
};

export default stats;
