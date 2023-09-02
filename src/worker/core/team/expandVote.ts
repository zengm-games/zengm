import { g, updatePlayMenu, toUI, logEvent } from "../../util";
import league from "../league";
import { getVoteResult } from "./relocateVote";

const rebrandVote = async ({
	override,
	userVote,
}: {
	override: boolean;
	userVote: boolean;
}) => {
	const autoExpand = g.get("autoExpand");
	if (!autoExpand) {
		throw new Error("Should never happen");
	}

	const result = getVoteResult(userVote, override);

	let eventText;

	if (result.for > result.against) {
		console.log("INIT EXPANSION");
	} else {
		const numTeams = autoExpand.abbrevs.length;
		eventText = `${
			numTeams > 1 ? `${numTeams} expansion teams` : "An expansion team"
		} wanted to join the league, but they lost the vote ${result.against}-${
			result.for
		}.`;

		logEvent({
			text: eventText,
			type: "teamExpansion",
			tids: [],
			showNotification: false,
			score: 20,
		});
	}

	await league.setGameAttributes({
		autoExpand: undefined,
	});

	await updatePlayMenu();

	await toUI("realtimeUpdate", [["team"]]);

	return result;
};

export default rebrandVote;
