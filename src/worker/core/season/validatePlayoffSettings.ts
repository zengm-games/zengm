import { getNumPlayoffTeamsRaw } from "./getNumPlayoffTeams";

const validatePlayoffSettings = ({
	numRounds,
	numPlayoffByes,
	numActiveTeams,
	playIn,
	byConf,
}: {
	numRounds: number;
	numPlayoffByes: number;
	numActiveTeams: number;
	playIn: boolean;
	byConf: boolean;
}) => {
	if (numPlayoffByes < 0) {
		throw new Error("Cannot have a negative number of byes");
	}

	if (numRounds === 1 && numPlayoffByes > 0) {
		throw new Error("You cannot have any byes in a one round playoff.");
	}

	if (numRounds === 0 && numPlayoffByes > 0) {
		throw new Error("You cannot have any byes if the playoffs are disabled.");
	}

	if (numRounds === 1 && playIn && byConf) {
		throw new Error(
			"You cannot have a play-in tournament if there is only one playoff round and the playoffs are split by conference.",
		);
	}

	const numPlayoffTeams = getNumPlayoffTeamsRaw({
		numRounds,
		numPlayoffByes,
		playIn,
		byConf,
	});

	if (numPlayoffTeams > numActiveTeams) {
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
