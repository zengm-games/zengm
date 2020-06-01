import { g, helpers } from "../../util";

const logLotteryTxt = (
	tid: number,
	type: "chance" | "moveddown" | "movedup" | "normal",
	number: number,
) => {
	let txt = `The <a href="${helpers.leagueUrl([
		"roster",
		g.get("teamInfoCache")[tid]?.abbrev,
		g.get("season"),
	])}">${g.get("teamInfoCache")[tid]?.name}</a>`;

	if (type === "chance") {
		txt += ` have a ${number.toFixed(
			2,
		)}% chance of getting the top overall pick of the ${g.get(
			"season",
		)} draft.`;
	} else if (type === "movedup") {
		txt += ` moved up in the lottery and will select ${helpers.ordinal(
			number,
		)} overall in the ${g.get("season")} draft.`;
	} else if (type === "moveddown") {
		txt += ` moved down in the lottery and will select ${helpers.ordinal(
			number,
		)} overall in the ${g.get("season")} draft.`;
	} else if (type === "normal") {
		txt += ` will select ${helpers.ordinal(number)} overall in the ${g.get(
			"season",
		)} draft.`;
	}

	return txt;
};

export default logLotteryTxt;
