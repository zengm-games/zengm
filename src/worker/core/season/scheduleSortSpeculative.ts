import type { ScheduleGameWithoutKey } from "src/common/types";
import { random } from "../../../worker/util";

//scheduleSort takes a list of nfl matches, and sorts them into an 18 week configuration, where each team has one bye.  I'm going
//to leave games (desired games per week for a full week), partWeeks and fullWeeks assignable, thought right now it's expecting defaults
//of 16 games a week, 10 fullWeeks, 8 partWeeks.  While there's a little fuzziness in my understanding, one thing that seems likely is that
//part weeks should be a factor of the total number of bye week matches.
// be returned as an array of weeks containing an array of matches
const scheduleSort = (
	matches: number[][],
	gamesPerWeek?: number,
	partiallyFullWeeks?: number,
	fullSlateWeeks?: number,
): ScheduleGameWithoutKey[] => {
	// A schedule is an array of weeks, each with an array of matches

	const games: number = typeof gamesPerWeek === "undefined" ? 16 : gamesPerWeek;
	const partWeeks: number =
		typeof partiallyFullWeeks === "undefined" ? 8 : partiallyFullWeeks;
	const fullWeeks: number =
		typeof fullSlateWeeks === "undefined" ? 10 : fullSlateWeeks;
	//I guess this could be a variable, so I'm leaving as is for a moment, but ideally, maxByesPerWeek should be double the ideal number of byes
	//in a given week (16 games across 8 weeks = 2 per, max of 4)
	const maxByesPerWeek: number = Math.ceil(games / partWeeks) * 2;

	//First sort: return desired number of full weeks.  From personal experience, this number can only be slightly
	//over half of all games assigned.  There's likely some general math principal that would give a better idea of what
	//the optimum amount of bye weeks given a set of games and desired number of games per week.
	const fullSlates: number[][][] = [];
	while (fullSlates.length < fullWeeks) {
		//Tentative week
		const week: number[][] = [];
		//Teams assigned to a week
		const assigned: number[] = [];
		//Is week partially full?  We'll assume this works, then set to true if we iterate through all matchups
		let notFull: boolean = false;
		// track matchups through iterations, avoid having to iterate over matchups and clean up after picking games
		let i: number = 0;

		while (week.length < games) {
			//if iterated through all matches and week is not full, break while loop, set notFull to true
			if (i >= matches.length) {
				notFull = true;
				break;
			}

			if (
				!assigned.includes(matches[i][0]) &&
				!assigned.includes(matches[i][1])
			) {
				assigned.push(matches[i][0], matches[i][1]);
				week.push(matches[i]);
				matches.splice(i, 1);
				i -= 1;
			}
			i += 1;
		}

		if (notFull === false) {
			fullSlates.push(week);
		} else {
			week.forEach((m, index) => {
				index % 2 === 0 ? matches.push(m) : matches.unshift(m); //Maybe cheaper just to shuffle matches instead of alternating push/unshift?
			});
		}
	}
	//Second Sort: partial Weeks.

	//We'll describe how it works across an NFL 17 game schedule
	//Partial weeks need to fit 112 matchups across 8 weeks.  Since it can be difficult to arrange these perfectly just by allocating,
	//we'll instead build 8 weeks with 88 games. Why? Through trial and error, this appears to be the maximum amount of games
	//we can allocate without occasionally getting locked in an unsolvable state.  Again, there's probably some high math underpinning what we
	//can allocate for any order of matches, but for now let's go with good enough.
	const partialWeeks: number[][][] = [];
	const partialAssigned: number[][] = [];
	while (partialWeeks.length < partWeeks) {
		const week: number[][] = [];
		const assigned: number[] = [];
		let notFull: boolean = false;
		let i: number = 0;

		//Set partial weeks length to games - (maxByePerWeek + 1).  This gives a little extra breathing room in our sort before the final sort
		//which is a little more labor intensive.  In the final sort we'll attempt to respect maxByesPerWeek, but it's not terribly
		//important (Which probably means it needs a new name.)
		while (week.length < games - (maxByesPerWeek + 2)) {
			if (i >= matches.length) {
				notFull = true;
				break;
			}

			if (
				!assigned.includes(matches[i][0]) &&
				!assigned.includes(matches[i][1])
			) {
				assigned.push(matches[i][0], matches[i][1]);
				week.push(matches[i]);
				matches.splice(i, 1);
				i -= 1;
			}
			i += 1;
		}

		if (notFull === false) {
			partialWeeks.push(week);
			partialAssigned.push(assigned);
		} else {
			week.reverse();
			week.forEach(m => {
				matches.push(m);
			});
		}
	}

	//The final sort deals with the final 24 unallocated games.  Assuming that this formula is provided with appropriate fullWeek and partWeek
	//values and provides a combination of partialWeek schedules and unallocated games that can be solved, this will eventually find it.
	//In practice, this process appears to reach that solution pretty quickly.
	let matchesLength: number = matches.length;
	while (matches.length > 0) {
		partialWeeks.forEach((week, i) => {
			let j = 0;
			while (j < matches.length) {
				if (
					!partialAssigned[i].includes(matches[j][0]) &&
					!partialAssigned[i].includes(matches[j][1])
				) {
					if (week.length < games - 1) {
						const match = matches.splice(j, 1)[0];
						week.push(match);
						partialAssigned[i].push(match[0], match[1]);
						j -= 1;
					}
				}
				j += 1;
			}
		});
		// If we were able to assign a match, then update matchesLength
		if (matchesLength != matches.length) {
			matchesLength = matches.length;
		} else {
			//Otherwise, we're stuck, so we need to dissolve a week and re-incorporate it.  We'll take
			//the dissolved week and add it back to the match pool, then reformulate a new week using the
			//matches that we weren't able to assign as the first matches is in the week, followed by the matches
			//of the dissolved week.
			const dissolving: number[][] = partialWeeks.shift()!;
			partialAssigned.shift();
			//The reverse might be unnecessary, but it helps vary the available matchups when we get stuck
			dissolving.reverse();
			dissolving.forEach(m => matches.push(m));
			//Create new week, allocate matches
			const newWeek: number[][] = [];
			const newWeekAssigned: number[] = [];

			let j = 0;
			while (j < matches.length) {
				if (
					!newWeekAssigned.includes(matches[j][0]) &&
					!newWeekAssigned.includes(matches[j][1])
				) {
					if (newWeek.length < games - 1) {
						const match = matches.splice(j, 1)[0];
						newWeek.push(match);
						newWeekAssigned.push(match[0], match[1]);
						j -= 1;
					}
				}
				j += 1;
			}
			//push newWeek and newWeekAssigned back to their respective arrays
			partialWeeks.push(newWeek);
			partialAssigned.push(newWeekAssigned);
		}
	}
	random.shuffle(fullSlates);
	random.shuffle(partialWeeks);
	const schedule: number[][][] = fullSlates
		.slice(0, 7)
		.concat(partialWeeks)
		.concat(fullSlates.slice(7));
	const finalSchedule: ScheduleGameWithoutKey[] = [];
	schedule.forEach((week, i) => {
		week.forEach(game => {
			finalSchedule.push({ awayTid: game[1], homeTid: game[0], day: i });
		});
	});
	return finalSchedule;
};

export default scheduleSort;
