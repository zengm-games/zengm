import helpers from "../../util/helpers.ts";

const raw = [
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
] as const;

// raw: recorded directly in game sim
// derived: still stored in database, but not directly recorded in game sim
// not present in this file: transiently derived things, like FG%
const stats = {
	derived: ["so", "oppQs", "oppRbs", "oppSo"],
	raw: [
		"gp",
		"min",
		...raw,
		...raw.map((stat) => `opp${helpers.upperCaseFirstLetter(stat)}` as const),
	] as const,
};

export default stats;
