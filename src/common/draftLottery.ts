import isSport from "./isSport";
import type { DraftLotteryResultArray, DraftType } from "./types";

class MultiDimensionalRange {
	initial: boolean;
	start: number;
	end: number;
	dimensions: number;

	constructor(end: number, dimensions: number) {
		this.initial = true;
		this.start = 0;
		this.end = end;
		this.dimensions = dimensions;
	}

	[Symbol.iterator]() {
		const value = Array(this.dimensions).fill(this.start);

		const getNextValue = (dimension: number): boolean => {
			if (value[dimension] < this.end - 1) {
				if (this.initial) {
					this.initial = false;
				} else {
					value[dimension] += 1;
				}
				return false;
			}

			if (dimension === 0) {
				return true;
			}

			for (let i = dimension; i < this.dimensions; i++) {
				value[i] = this.start;
			}
			return getNextValue(dimension - 1);
		};

		return {
			next: () => {
				const dimension = this.dimensions - 1;
				const done = getNextValue(dimension);
				if (done) {
					return {
						done,
					};
				}

				return {
					value,
					done,
				};
			},
		};
	}
}

export const draftTypeDescriptions: Record<DraftType | "dummy", string> = {
	nba2019: "Weighted lottery for the top 4 picks, like the NBA since 2019",
	nba1994: "Weighted lottery for the top 3 picks, like the NBA from 1994-2018",
	nba1990: "Weighted lottery for the top 3 picks, like the NBA from 1990-1993",
	nhl2017: "Weighted lottery for the top 3 picks, like the NHL from 2017-2020",
	nhl2021: "Weighted lottery for the top 2 picks, like the NHL since 2021",
	mlb2022: "Weighted lottery for the top 6 picks, like the MLB since 2022",
	randomLotteryFirst3:
		"Random lottery for the top 3 picks, like the NBA from 1987-1989",
	randomLottery:
		"Non-playoff teams draft in random order, like the NBA from 1985-1986",
	coinFlip:
		"Coin flip to determine the top 2 picks, like the NBA from 1966-1984",
	noLottery:
		"No lottery, teams draft in order of their record, from worst to best with non-playoff teams coming first",
	noLotteryReverse:
		"No lottery, teams draft in order of their record, from best to worst with playoff teams coming first",
	random: "Teams draft in random order, including playoff teams",
	freeAgents:
		"There is no draft and all, rookies simply become free agents who can be signed by any team",
	custom: "Custom weighted lottery for the top N picks.",
	dummy: "From historical data",
};

const draftLotteryProbsTooSlow = (numTeams: number, numToPick: number) => {
	const count = numTeams ** numToPick;

	// This will happen for baseball (18 teams, 6 picks) except for the hardcoded default
	return count >= 1e7;
};

const simLottery = (chances: number[], numToPick: number) => {
	let teams = chances.map((chance, index) => ({
		chances: chance,
		index,
	}));

	const pickIndexes: number[] = [];

	for (let i = 0; i < numToPick; i++) {
		let sum = 0;
		for (const t of teams) {
			sum += t.chances;
		}
		const rand = Math.random() * sum;
		let sum2 = 0;
		for (const t of teams) {
			sum2 += t.chances;
			if (rand < sum2) {
				pickIndexes.push(t.index);
				teams = teams.filter(t2 => t2 !== t);

				break;
			}
		}
	}

	pickIndexes.push(...teams.map(team => team.index));

	return pickIndexes;
};

// If it's too slow to calculate the precise probability, just estimate
const monteCarloLotteryProbs = (
	result: DraftLotteryResultArray,
	numToPick: number,
) => {
	const ITERATIONS = 100000;

	const probs: number[][] = [];

	const chances = result.map(row => row.chances);

	for (let i = 0; i < ITERATIONS; i++) {
		const result = simLottery(chances, numToPick);
		for (let j = 0; j < result.length; j++) {
			const k = result[j];
			if (!probs[k]) {
				probs[k] = [];
			}
			if (probs[k][j] === undefined) {
				probs[k][j] = 1 / ITERATIONS;
			} else {
				probs[k][j] += 1 / ITERATIONS;
			}
		}
	}

	return probs;
};

export const getDraftLotteryProbs = (
	result: DraftLotteryResultArray | undefined,
	draftType: DraftType | "dummy" | undefined,
	numToPick: number,
): {
	tooSlow: boolean;
	probs?: (number | undefined)[][];
} => {
	if (
		result === undefined ||
		draftType === undefined ||
		draftType === "random" ||
		draftType === "noLottery" ||
		draftType === "noLotteryReverse" ||
		draftType === "freeAgents" ||
		draftType === "dummy"
	) {
		return {
			tooSlow: false,
		};
	}

	const probs: number[][] = [];
	const totalChances = result.reduce(
		(total, { chances }) => total + chances,
		0,
	);

	if (draftType === "randomLottery") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = [];
			for (let j = 0; j < result.length; j++) {
				probs[i][j] = 1 / result.length;
			}
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	if (draftType === "coinFlip") {
		for (let i = 0; i < result.length; i++) {
			probs[i] = [];
			for (let j = 0; j < result.length; j++) {
				if (i === 0 && j <= 1) {
					probs[i][j] = 0.5;
				} else if (i === 1 && j <= 1) {
					probs[i][j] = 0.5;
				} else if (i === j) {
					probs[i][j] = 1;
				} else {
					probs[i][j] = 0;
				}
			}
		}

		return {
			tooSlow: false,
			probs,
		};
	}

	const tooSlow = draftLotteryProbsTooSlow(result.length, numToPick);

	if (tooSlow) {
		// Cache default baseball probs
		if (
			isSport("baseball") &&
			result.length === 18 &&
			draftType === "mlb2022"
		) {
			return {
				tooSlow: false,
				probs: [
					[
						0.165, 0.15576720794109877, 0.14480619110407933,
						0.13164462525609194, 0.11576396415791242, 0.09684947768879096,
						0.1901685338519709,
					],
					[
						0.165, 0.15576720794109877, 0.14480619110407933,
						0.13164462525609194, 0.11576396415791242, 0.09684947768879096,
						0.16216299375004062, 0.02800554010196193,
					],
					[
						0.165, 0.15576720794109877, 0.14480619110407933,
						0.13164462525609194, 0.11576396415791242, 0.09684947768879096,
						0.1372989076161051, 0.04972817226789706, 0.0031414539680165838,
					],
					[
						0.1325, 0.1310306707642804, 0.12850710848231311,
						0.12429941383491513, 0.11735911415382998, 0.10636242642454236,
						0.15737955446462482, 0.09038312801617278, 0.011815968421073518,
						0.0003626154382698181,
					],
					[
						0.1, 0.10305373637995587, 0.10615566782894872, 0.10902391517888077,
						0.11093885385919779, 0.11009938441999004, 0.1650406335376107,
						0.15726738529774273, 0.03590545983633826, 0.002470374460535636,
						0.000044589200803934105,
					],
					[
						0.075, 0.07954255453721912, 0.084788396598796, 0.09082366239874036,
						0.09756739415327453, 0.10424907028532834, 0.12937183781872205,
						0.23332248004134803, 0.09315203830962038, 0.011686606061046956,
						0.0004902875323218922, 0.000005672263575295469,
					],
					[
						0.055, 0.05958960791902863, 0.06513682098526945, 0.0719382580916515,
						0.0803443769663658, 0.09053491593412344, 0.05857753896084902,
						0.26636246306414174, 0.20347964648709174, 0.04540432485296898,
						0.003534696489450507, 0.00009660708998548051, 7.431590727775191e-7,
					],
					[
						0.039,
						0.04294156419477313,
						0.04782746212076217,
						0.054017775309038785,
						0.062033119828371244,
						0.07253025523340617,
						undefined,
						0.17493083121076475,
						0.33875302649926914,
						0.14633340549775828,
						0.0205555226232268,
						0.0010574687402663012,
						0.000019468011580553388,
						1.007307855866169e-7,
					],
					[
						0.027,
						0.03007527963450997,
						0.03394597385877865,
						0.03894355580840428,
						0.04557891851313092,
						0.05460299287110623,
						undefined,
						undefined,
						0.31375240647859665,
						0.34970960103461296,
						0.09690677967664187,
						0.009158007549822121,
						0.0003224237034944421,
						0.00000404693704304753,
						1.3933878864773004e-8,
					],
					[
						0.018,
						0.020219733648188385,
						0.02304154684570816,
						0.026728546410766756,
						0.03169835151609111,
						0.03860275363950401,
						undefined,
						undefined,
						undefined,
						0.4440330726548158,
						0.3298867003592393,
						0.06347234622014694,
						0.0042128022171693345,
						0.0001032674208954107,
						8.771364318569161e-7,
						1.9310500467595202e-9,
					],
					[
						0.014,
						0.015784295687288927,
						0.0180618463655901,
						0.02105199351204514,
						0.025106356830289306,
						0.030784210615212516,
						undefined,
						undefined,
						undefined,
						undefined,
						0.5485814241183381,
						0.28580241850499394,
						0.03898082001063498,
						0.0018161387585839605,
						0.000030329804913461072,
						1.655831869833862e-7,
						2.0891903783967186e-10,
					],
					[
						0.011,
						0.012435787420175098,
						0.014273883950060847,
						0.016695323655315984,
						0.019992194998831554,
						0.02463468372652866,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.6404074796312379,
						0.23706579084753307,
						0.022762741283476468,
						0.0007243038348072441,
						0.000007786269845417551,
						2.4368995937630926e-8,
						1.3207939680098094e-11,
					],
					[
						0.009,
						0.01019310065361076,
						0.011723421652892491,
						0.013743832887794625,
						0.016501943085283247,
						0.02039917533197575,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.7193979520505391,
						0.18660762059962163,
						0.012183048588917621,
						0.0002483803063985847,
						0.0000015228076997002478,
						2.035285280250164e-9,
					],
					[
						0.0076,
						0.008618326071554062,
						0.00992618357441343,
						0.011655473760020426,
						0.014020386265896221,
						0.017369761833142077,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.7887060842696096,
						0.13642860528918216,
						0.005610757918841672,
						0.0000642551561055299,
						1.6586126927624857e-7,
					],
					[
						0.0062,
						0.00703954072959407,
						0.008119170018355057,
						0.009548786204843018,
						0.011507279472429693,
						0.014287255497189061,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.8506328214118445,
						0.09060372648350994,
						0.0020517113741696518,
						0.000009708808066687886,
					],
					[
						0.0048,
						0.005456761554169285,
						0.006302412928145415,
						0.007423814055924308,
						0.008962676160923824,
						0.011151728799563145,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.9035291815071625,
						0.05189891334138028,
						0.000474511652701713,
					],
					[
						0.0036,
						0.004096927685109965,
						0.004737461756390747,
						0.0055878900855225845,
						0.006756561492941474,
						0.008421995432556492,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.9459835727427753,
						0.020815590804747444,
					],
					[
						0.0023,
						0.002620489297245929,
						0.0030340697213373548,
						0.003583883037859111,
						0.004340580229405994,
						0.005420956889431526,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						0.9787000208246268,
					],
				],
			};
		} else {
			// Estimate probs
			return {
				tooSlow,
				probs: monteCarloLotteryProbs(result, numToPick),
			};
		}
	}

	const skipped: number[][] = [];

	// Get probabilities of top N picks for all teams
	for (let i = 0; i < result.length; i++) {
		probs[i] = [];

		// Initialize values that we'll definitely fill in soon
		for (let j = 0; j < numToPick; j++) {
			probs[i][j] = 0;
		}

		// +1 is to handle the case of 0 skips to N skips
		skipped[i] = Array(numToPick + 1).fill(0);
	}

	const getProb = (indexes: number[]): number => {
		const currentTeamIndex = indexes[0];
		const prevLotteryWinnerIndexes = indexes.slice(1);

		let chancesLeft = totalChances;
		for (const prevTeamIndex of prevLotteryWinnerIndexes) {
			chancesLeft -= result[prevTeamIndex].chances;
		}

		const priorProb =
			prevLotteryWinnerIndexes.length === 0
				? 1
				: getProb(prevLotteryWinnerIndexes);

		const prob = (priorProb * result[currentTeamIndex].chances) / chancesLeft;

		return prob;
	};

	for (let pickIndex = 0; pickIndex < numToPick; pickIndex += 1) {
		const range = new MultiDimensionalRange(result.length, pickIndex + 1);
		for (const indexes of range) {
			const indexesSet = new Set(indexes);
			if (indexes.length !== indexesSet.size) {
				// Skip case where this team already got an earlier pick
				continue;
			}

			const currentTeamIndex = indexes[0];

			// We're looking at every combination of lottery results. getProb will fill in the probability of this result in probs
			const prob = getProb(indexes);
			probs[currentTeamIndex][pickIndex] += prob;

			// For the later picks, account for how many times each team was "skipped" (lower lottery team won lottery and moved ahead) and keep track of those probabilities
			if (pickIndex === numToPick - 1) {
				for (let i = 0; i < skipped.length; i++) {
					if (indexesSet.has(i)) {
						continue;
					}

					let skipCount = 0;
					for (const ind of indexes) {
						if (ind > i) {
							skipCount += 1;
						}
					}

					skipped[i][skipCount] += prob;
				}
			}
		}
	}

	// Fill in picks (N+1)+
	for (let i = 0; i < result.length; i++) {
		// Fill in table after first N picks
		for (let j = 0; j < numToPick + 1; j++) {
			if (i + j > numToPick - 1 && i + j < result.length) {
				probs[i][i + j] = skipped[i][j];
			}
		}
	}

	return {
		tooSlow,
		probs,
	};
};
