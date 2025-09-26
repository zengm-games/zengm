import type { ByConf } from "../../../common/types.ts";
import { getNumPlayoffTeamsRaw } from "./getNumPlayoffTeams.ts";

const validatePlayoffSettings = ({
	numRounds,
	numPlayoffByes,
	numActiveTeams,
	playIn,
	byConf,
}: {
	numRounds: number;
	numPlayoffByes: number;
	numActiveTeams: number | undefined; // For DefaultNewLeagueSettings where we can know everything but this
	playIn: boolean;
	byConf: ByConf;
}) => {
	if (numPlayoffByes < 0) {
		throw new Error("Cannot have a negative number of byes");
	}

	// This would be handled by the below check too, but this is a nicer error message for the common case
	if (numRounds === 2 && numPlayoffByes > 0 && byConf !== false) {
		throw new Error(
			"You cannot have any byes in a two round playoff split by conference.",
		);
	}

	if (byConf !== false && numPlayoffByes > 0 && numRounds > 0) {
		// Make sure there are not too many byes
		const numFirstRoundMatchups = 2 ** (numRounds - 1);
		if (numPlayoffByes >= numFirstRoundMatchups) {
			throw new Error("Too many byes for your playoff settings.");
		}
	}

	if (numRounds === 1 && numPlayoffByes > 0) {
		throw new Error("You cannot have any byes in a one round playoff.");
	}

	if (numRounds === 0 && numPlayoffByes > 0) {
		throw new Error("You cannot have any byes if the playoffs are disabled.");
	}

	if (numRounds === 1 && playIn && byConf !== false) {
		throw new Error(
			"You cannot have a play-in tournament if there is only one playoff round and the playoffs are split by conference.",
		);
	}

	const numTeams = getNumPlayoffTeamsRaw({
		numRounds,
		numPlayoffByes,
		playIn,
		byConf,
	});
	const numPlayoffTeams = numTeams.numPlayoffTeams + numTeams.numPlayInTeams;

	if (numActiveTeams !== undefined && numPlayoffTeams > numActiveTeams) {
		throw new Error(
			`${numRounds} playoff rounds with ${numPlayoffByes} first round byes${
				playIn ? " and a play-in tournament" : ""
			} means ${numPlayoffTeams} teams make the playoffs, but there are only ${numActiveTeams} teams in the league`,
		);
	}

	let numTeamsSecondRound;
	if (numRounds === 1) {
		// Because there is no second round!
		numTeamsSecondRound = 0;
	} else {
		numTeamsSecondRound = 2 ** (numRounds - 1);
	}

	if (numTeamsSecondRound < numPlayoffByes) {
		throw new Error(
			`With ${numRounds} playoff rounds, you need ${numTeamsSecondRound} teams in the second round, so it's not possible to have ${numPlayoffByes} first round byes`,
		);
	}
};

export default validatePlayoffSettings;
