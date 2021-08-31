const validatePlayoffSettings = ({
	numRounds,
	numPlayoffByes,
	numActiveTeams,
}: {
	numRounds: number;
	numPlayoffByes: number;
	numActiveTeams: number;
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

	const numPlayoffTeams = 2 ** numRounds - numPlayoffByes;

	if (numPlayoffTeams > numActiveTeams) {
		throw new Error(
			`${numRounds} playoff rounds with ${numPlayoffByes} first round byes means ${numPlayoffTeams} teams make the playoffs, but there are only ${numActiveTeams} teams in the league`,
		);
	}

	let numTeamsSecondRound;
	if (numRounds === 1) {
		// Becuase there is no second round!
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
