// Assign matches based on NFL rules.
// Rules:
// Home/away vs division
// mixed vs. another division same conference
// mixed vs. another division other conference
// mixed vs. same rank, another division same conference (2 games)
// 1 from other division, other conference, switch homeaway based on season

// # Table (array visualization):
// #                     AFC             |             NFC
// # Place | East | North | South | West | East | North | South | West
// # 1st   |  0   |   1   |   2   |  3   |  4   |   5   |   6   |  7
// # 2nd  |  8    |   9   |   10  |  11  |  12  |  13   |  14   |  15
// # 3rd  |  16   |  17   |   18  |  19  |  20  |  21   |  22   |  23
// # 4th  |  24   |  25   |   26  |  27  |  28  |  29   |  30   |  31
// ##

//nestedArrayIncludes, checks for whether a nested match array is equitable.  Uses array.some()
//and checks whether first item === first item and second item === second item
const nestedArrayIncludes = (
	array: Array<Array<number>>,
	nested: Array<number>,
) => {
	return array.some(i => {
		const test = i;
		return test[0] === nested[0] && test[1] === nested[1];
	});
};

// generateMatches takes an array of teams, as described above, and the year and returns an array of arrays, which carry
// home and away team matches based on position in the teams array.  This creates the current 17 game NFL schedule using
// the NFL's current scheduling formula.
const generateMatches = (teams: Array<number>, year: number): number[][] => {
	// Once the cross/intraConferenceOffsets can be derived, then most of this solution can be applied to any
	// evenly distributed number of divisions with an equal number of teams.
	const conferences = 2;
	const divisions = 4;
	const teamsPerDiv = teams.length / (conferences * divisions);

	const matches: number[][] = [];
	// interConferenceOffsets are assigned so that divisions play each other once every divisions years.
	// I feel like I'm really forgetting some basic math to generate this pattern, but until I remember it, hardcode
	// for 4 divisions
	const crossConferenceOffsets = [
		[0, 1, 2, 3],
		[1, 0, 3, 2],
		[2, 3, 0, 1],
		[3, 2, 1, 0],
	];
	// Same here, It's driving me nuts.
	const intraConferenceOffsets = [
		[1, 0, 3, 2],
		[2, 3, 0, 1],
		[3, 2, 1, 0],
	];
	// Divisional States will carry the possible binary representations of home and away games for divisional
	// matches where we want to face all teams once.  This should work for any even square number of games for sure
	// and can likely be tweaked for any number of equal sized divisions.  The '16' below should be 2^n, where n is the
	// number of games.
	// [...Array(16).keys()].filter(n => ((n >>> 0).toString(2)).match('/0/g')?.length === 2)???
	const divisionalStates: Array<number> = [3, 5, 6, 9, 10, 12];
	//Tracks pairs of intra-conference division pairings
	const intraConferenceSets = new Map<number, number>();
	//tracks pairs of cross conference division pairings
	const crossConferenceSets = new Map<number, number>();
	//tracks pairs of intra-conference matches based on rank (two divisions not playing a full slate against team)
	const intraRankSet = new Map<number, number>();

	// Iterate team IDs, using i as the positional index and assigning matches with tID
	teams.forEach((tID, i) => {
		const div = i % (conferences * divisions);
		//some silly float rounding is killing me here, but it appears we can use bitwise OR 0 to do what we want
		const rank = (i / (conferences * divisions)) | 0;
		// Divisions for conference sets will be set based on the year, as well as offsets.  This
		// rotates the matches every divisions years, with same conference games rotating
		// divisions - 1 years, since a division already plays itself.
		const divSameConf =
			div < divisions
				? intraConferenceOffsets[year % (divisions - 1)][div]
				: intraConferenceOffsets[year % (divisions - 1)][div % divisions] +
				  divisions;
		const divOtherConf =
			div < divisions
				? crossConferenceOffsets[year % divisions][div] + divisions
				: crossConferenceOffsets[year % divisions][div % divisions];

		// Just take divisions /2, so it offset by at least one in all multi-division scenarios
		const extraDiv =
			div < divisions
				? crossConferenceOffsets[(year + ((divisions / 2) | 0)) % divisions][
						div
				  ] + divisions
				: crossConferenceOffsets[(year + ((divisions / 2) | 0)) % divisions][
						div % divisions
				  ];
		// IntraConfRanked holds the remaining divisions in the same conference that are not already assigned to get games.
		const intraConfRanked = Array.from(Array(divisions).keys())
			.filter(dID => dID !== divSameConf % divisions && dID !== div % divisions)
			.map(dID => (div < divisions ? dID : dID + divisions));

		//Assign intraConfRanked to intraRankSet, so that we can track home and away. Since there's only two games that used ranked atm (H/A or A/H),
		//We can skip a binary representation and instead just track on a simple map.  We'll just check if the dID has already been assigned
		//a home game (key), if not, assigned as a home game else assign as an away game.
		intraConfRanked.forEach(dID => {
			if (!Array.from(intraRankSet.keys()).includes(div)) {
				if (!Array.from(intraRankSet.values()).includes(dID)) {
					intraRankSet.set(div, dID);
				}
			} else if (!Array.from(intraRankSet.values()).includes(div)) {
				if (!Array.from(intraRankSet.keys()).includes(dID)) {
					intraRankSet.set(dID, div);
				}
			}
		});

		//Assign intra and crossConference sets.  Since these are 1:1 divisional matches, just ensure each div is assigned once.
		if (
			!Array.from(intraConferenceSets.keys()).includes(div) &&
			!Array.from(intraConferenceSets.values()).includes(div)
		) {
			intraConferenceSets.set(div, divSameConf);
		}

		if (
			!Array.from(crossConferenceSets.keys()).includes(div) &&
			!Array.from(crossConferenceSets.values()).includes(div)
		) {
			crossConferenceSets.set(div, divOtherConf);
		}

		//Major and Minor states carry the binary representation for home and away games between 4 teams on any given year.
		//So take the year, get the remainder from the total number of possible states, and that will give the layout of games
		//for that year.
		let majorState =
			divisionalStates[year % divisionalStates.length].toString(2);
		//Since Javascript is somehow even worse for binary operations than python, we'll have to ensure we add the appropriate number of
		//zeros to the start of a binary string.
		while (majorState.length < 4) {
			majorState = "0".concat(majorState);
		}
		//Anything bitwise appears to be a pain in JS, so we'll just invert using an array
		const minorState = Array.from(majorState)
			.map(d => {
				if (d === "0") {
					return "1";
				} else {
					return "0";
				}
			})
			.join("");

		// Finally assign the binary representations based on rank and whether the division has been assigned first or
		// second in the conference set maps
		let intraArrangement: string;
		let crossArrangement: string;
		if (majorState[rank] === "0") {
			intraArrangement = Array.from(intraConferenceSets.keys()).includes(div)
				? majorState
				: minorState;
			crossArrangement = Array.from(crossConferenceSets.keys()).includes(div)
				? majorState
				: minorState;
		} else {
			intraArrangement = Array.from(intraConferenceSets.keys()).includes(div)
				? minorState
				: majorState;
			crossArrangement = Array.from(crossConferenceSets.keys()).includes(div)
				? minorState
				: majorState;
		}

		// Instead of iterating all teams, we can iterate over teams per div and set the matches where divisions play
		// another division.  In this instance, the teamsPerDiv keys will stand in for the ranks of opposing teams
		Array.from(Array(teamsPerDiv).keys()).forEach(oppRank => {
			// opposing rank is the row offset.  With this we can derive the position of the opposing team, then
			// place into spot
			const opposingRankOffset = oppRank * divisions * conferences;

			//intra-division matches.  Home and away against every team in division.  Using the opposingRankOffset,
			//We can add that, plus the division, to find the team ID of the opposing team in the teams (array)

			// if opposing is not the same as the current index
			if (opposingRankOffset + div !== i) {
				// Check if we have a home game
				if (
					!nestedArrayIncludes(matches, [tID, teams[opposingRankOffset + div]])
				) {
					matches.push([tID, teams[opposingRankOffset + div]]);
				}
				// check for away game
				if (
					!nestedArrayIncludes(matches, [teams[opposingRankOffset + div], tID])
				) {
					matches.push([teams[opposingRankOffset + div], tID]);
				}
			}

			//intra-conference Divisional matches
			if (intraArrangement[oppRank] === "0") {
				if (
					!nestedArrayIncludes(matches, [
						tID,
						teams[opposingRankOffset + divSameConf],
					])
				) {
					matches.push([tID, teams[opposingRankOffset + divSameConf]]);
				}
			} else {
				if (
					!nestedArrayIncludes(matches, [
						teams[opposingRankOffset + divSameConf],
						tID,
					])
				) {
					matches.push([teams[opposingRankOffset + divSameConf], tID]);
				}
			}

			//cross conference divisional matches
			if (crossArrangement[oppRank] === "0") {
				if (
					!nestedArrayIncludes(matches, [
						tID,
						teams[opposingRankOffset + divOtherConf],
					])
				) {
					matches.push([tID, teams[opposingRankOffset + divOtherConf]]);
				}
			} else {
				if (
					!nestedArrayIncludes(matches, [
						teams[opposingRankOffset + divOtherConf],
						tID,
					])
				) {
					matches.push([teams[opposingRankOffset + divOtherConf], tID]);
				}
			}
		});
		// 14 games down

		// Iterate through intraRankSet to find relevant matches
		for (const [d1, d2] of Array.from(intraRankSet.entries())) {
			if (d1 === div) {
				const opp = teams[d2 + rank * divisions * conferences];
				if (!nestedArrayIncludes(matches, [tID, opp])) {
					matches.push([tID, opp]);
				}
			} else if (d2 === div) {
				const opp = teams[d1 + rank * divisions * conferences];
				if (!nestedArrayIncludes(matches, [opp, tID])) {
					matches.push([opp, tID]);
				}
			}
		}

		// 17th game is a home game distributed every other year to a conference
		if (year % 2 === 0) {
			// conference splits at halfway point
			if (div < divisions) {
				const opp = teams[extraDiv + rank * divisions * conferences];
				matches.push([tID, opp]);
			}
		} else {
			if (div >= divisions) {
				const opp = teams[extraDiv + rank * divisions * conferences];
				matches.push([tID, opp]);
			}
		}
	});
	return matches;
};

export default generateMatches;
