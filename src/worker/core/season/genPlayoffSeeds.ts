type Seed = [number, number | undefined]; // Return the seeds (0 indexed) for the matchups, in order (undefined is a bye)

const genPlayoffSeeds = (
	numPlayoffTeams: number,
	numPlayoffByes: number,
): Seed[] => {
	const numRounds = Math.log2(numPlayoffTeams + numPlayoffByes);

	if (!Number.isInteger(numRounds)) {
		throw new Error(
			`Invalid genSeeds input: ${numPlayoffTeams} teams and ${numPlayoffByes} byes`,
		);
	}

	// Handle byes - replace lowest seeds with undefined
	const byeSeeds: number[] = [];

	for (let i = 0; i < numPlayoffByes; i++) {
		byeSeeds.push(numPlayoffTeams + i);
	}

	const addMatchup = (
		currentRound: Seed[],
		team1: number | undefined,
		maxTeamInRound: number,
	) => {
		if (typeof team1 !== "number") {
			throw Error("Invalid type");
		}

		const otherTeam = maxTeamInRound - team1;
		currentRound.push([
			team1,
			byeSeeds.includes(otherTeam) ? undefined : otherTeam,
		]);
	};

	// Grow from the final matchup
	let lastRound: Seed[] = [[0, 1]];

	for (let i = 0; i < numRounds - 1; i++) {
		// Add two matchups to currentRound, for the two teams in lastRound. The sum of the seeds in a matchup is constant for an entire round!
		const numTeamsInRound = lastRound.length * 4;
		const maxTeamInRound = numTeamsInRound - 1;
		const currentRound: Seed[] = [];

		for (const matchup of lastRound) {
			// swapOrder stuff is just cosmetic, matchups would be the same without it, just displayed slightly differently
			const swapOrder =
				(currentRound.length / 2) % 2 === 1 && matchup[1] !== undefined;
			addMatchup(currentRound, matchup[swapOrder ? 1 : 0], maxTeamInRound);
			addMatchup(currentRound, matchup[swapOrder ? 0 : 1], maxTeamInRound);
		}

		lastRound = currentRound;
	}

	return lastRound;
};

export default genPlayoffSeeds;
