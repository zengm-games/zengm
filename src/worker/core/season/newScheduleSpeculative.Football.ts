// Assign matches based on NFL rules.
// Rules:
// Home/away vs division
// mixed vs. another division same conference
// mixed vs. another division other conference
// mixed vs. same rank, another division same conference (2 games)
// 1 from other division, other conference, switch home/away based on season

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
const nestedArrayIncludes = (array: number[][], nested: number[]): boolean => {
	return array.some(i => {
		return i[0] === nested[0] && i[1] === nested[1];
	});
};

// generateMatches takes the year and returns an array of arrays, which carry
// home and away team matches based on position in the teams array.  This creates the current
// 17 game NFL schedule using the NFL's current scheduling formula.
const generateMatches = async (
	teams: number[],
	year: number,
): Promise<number[][]> => {
	//For the time being, I'm not feeling super inspired for how to further expand the functionality.
	//Ideally, one would be able to pass these as arguments and we'd figure out how
	//to allocate games dynamically based on conference and division alignment.
	const conferences: number = 2;
	const divisions: number = 4;
	const teamsPerDiv: number = teams.length / (conferences * divisions);

	const matches: number[][] = [];

	//Conference offsets work according to this table.  Utilizing this pattern we can ensure
	//that every division will play each other every 4 years.
	//Divs   | 0 1 2 3
	// ----------------
	//Year 0 | 0 1 2 3
	//Year 1 | 1 0 3 2
	//Year 2 | 2 3 0 1
	//Year 3 | 3 2 1 0
	//So this is apparently a Latin Square.
	//After some thinking, I think we can create these particular latin squares by using a the smallest
	//version and applying the pattern across pairs of the next sized version.
	// So this means that:
	//	0	|	1
	//	1	|	0
	// can be applied to the next size up:
	// Pairs = [0,1], [2,3]
	// [0,1], [2,3]					[0,1,2,3]
	// [1,0], [3,2]	  which can		[1,0,3,2]
	// [2,3], [0,1]	  simplify to	[2,3,0,1]
	// [3,2], [1,0]					[3,2,1,0]
	// and you can use this configuration to generate the next size up, and so on.
	const latinSquareBuilder = (base: number): number[][] => {
		//Start with first combination
		let start: number[][] = [
			[0, 1],
			[1, 0],
		];
		//Base 1 is the first combination, so good work
		if (base === 1) {
			return start;
		}
		// We'll run up the bases, starting at 2 (since we've already solved for 1)
		for (let i = 2; i < base + 1; i++) {
			const combos = 2 ** i;
			const pairs: number[][] = [];
			//Create pairs from combos
			for (let j = 0; j < combos; j++) {
				if (j % 2 == 0) {
					pairs.push([j]);
				} else {
					pairs[(j / 2) | 0].push(j);
				}
			}
			// build a temp square based on the current square, pairs
			const tempSquare: number[][] = [];
			for (let j = 0; j < combos; j++) {
				tempSquare.push([]);
				const row = (j / 2) | 0;
				//normal order
				if (j % 2 == 0) {
					for (let k = 0; k < combos; k = k + 2) {
						const col = (k / 2) | 0;
						tempSquare[j].push(
							pairs[start[row][col]][0],
							pairs[start[row][col]][1],
						);
					}
					//reverse
				} else {
					for (let k = 0; k < combos; k = k + 2) {
						const col = (k / 2) | 0;
						tempSquare[j].push(
							pairs[start[row][col]][1],
							pairs[start[row][col]][0],
						);
					}
				}
			}
			//replace start with tempSquare, use start to seed the next size up.
			start = JSON.parse(JSON.stringify(tempSquare));
		}
		return start;
	};

	//Only works for 2,4,8... ect. (Math.log2 returns a whole number) divisions.
	const crossConferenceOffsets: number[][] = latinSquareBuilder(
		Math.log2(divisions),
	);

	//IntraConference is the same as cross conference, without the first item.
	const intraConferenceOffsets: number[][] = crossConferenceOffsets.slice(1);

	// Divisional States will carry the possible binary representations of home and away games for divisional
	// matches where we want to face all teams once.  This should work for any even square number of games for sure
	// and can likely be tweaked for any number of equal sized divisions.  The '16' below should be 2^n, where n is the
	// number of games.

	// Thankfully, someone already asked this on Stack Overflow, and even better, someone left a great answer that's already
	// in javascript which is quite nice.
	// https://stackoverflow.com/questions/36451090/permutations-of-binary-number-by-swapping-two-bits-not-lexicographically/36466454#36466454

	// So we'll avail ourselves to the walking bit algo.
	function walkingBits(n: number, k: number, container: number[][]) {
		const seq: number[] = [];
		for (let i = 0; i < n; i++) seq[i] = 0;
		walk(n, k, 1, 0);

		function walk(n: number, k: number, dir: number, pos: number) {
			for (let i = 1; i <= n - k + 1; i++, pos += dir) {
				seq[pos] = 1;
				if (k > 1)
					walk(
						n - i,
						k - 1,
						i % 2 ? dir : -dir,
						pos + dir * (i % 2 ? 1 : n - i),
					);
				else container.push(JSON.parse(JSON.stringify(seq)));
				seq[pos] = 0;
			}
		}
	}

	const divisionalStates: number[][] = [];
	walkingBits(4, 2, divisionalStates);
	//Tracks pairs of intra-conference division pairings
	const intraConferenceSets = new Map<number, number>();
	//tracks pairs of cross conference division pairings
	const crossConferenceSets = new Map<number, number>();
	//tracks pairs of intra-conference matches based on rank (two divisions not playing a full slate against team)
	const intraRankSet = new Map<number, number>();

	// Iterate team IDs, using i as the positional index and assigning matches with tID
	teams.forEach((tID, i) => {
		const div: number = i % (conferences * divisions);
		//some silly float rounding is killing me here, but it appears we can use bitwise OR 0 to do what we want
		const rank: number = (i / (conferences * divisions)) | 0;
		// Divisions for conference sets will be set based on the year, as well as offsets.  This
		// rotates the matches every divisions years, with same conference games rotating
		// divisions - 1 years, since a division already plays itself.
		const divSameConf: number =
			div < divisions
				? intraConferenceOffsets[year % (divisions - 1)][div]
				: intraConferenceOffsets[year % (divisions - 1)][div % divisions] +
				  divisions;
		const divOtherConf: number =
			div < divisions
				? crossConferenceOffsets[year % divisions][div] + divisions
				: crossConferenceOffsets[year % divisions][div % divisions];

		// Just take divisions /2, so it offset by at least one in all multi-division scenarios
		const extraDiv: number =
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
		const majorState: number[] =
			divisionalStates[year % divisionalStates.length];

		//Anything bitwise appears to be a pain in JS, so we'll just invert using an array
		const minorState: number[] = majorState.map(d => {
			if (d === 0) {
				return 1;
			} else {
				return 0;
			}
		});

		// Finally assign the binary representations based on rank and whether the division has been assigned first or
		// second in the conference set maps
		let intraArrangement: number[];
		let crossArrangement: number[];
		if (majorState[rank] === 0) {
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
			const opposingRankOffset: number = oppRank * divisions * conferences;

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
			if (intraArrangement[oppRank] === 0) {
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
			if (crossArrangement[oppRank] === 0) {
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
				const opp: number = teams[d2 + rank * divisions * conferences];
				if (!nestedArrayIncludes(matches, [tID, opp])) {
					matches.push([tID, opp]);
				}
			} else if (d2 === div) {
				const opp: number = teams[d1 + rank * divisions * conferences];
				if (!nestedArrayIncludes(matches, [opp, tID])) {
					matches.push([opp, tID]);
				}
			}
		}

		// 17th game is a home game distributed every other year to a conference
		if (year % 2 === 0) {
			// conference splits at halfway point
			if (div < divisions) {
				const opp: number = teams[extraDiv + rank * divisions * conferences];
				matches.push([tID, opp]);
			}
		} else {
			if (div >= divisions) {
				const opp: number = teams[extraDiv + rank * divisions * conferences];
				matches.push([tID, opp]);
			}
		}
	});
	return matches;
};

export default generateMatches;
