import { bySport } from "./buildFuncs.js";

const genRatings = (sport /*: string*/) => {
	const properties = {
		fuzz: {
			type: "number",
		},
		injuryIndex: {
			type: "integer",
		},
		ovr: {
			type: "number",
			minimum: 0,
			maximum: 100,
		},
		pos: {
			type: "string",
		},
		pot: {
			type: "number",
			minimum: 0,
			maximum: 100,
		},
		season: {
			type: "integer",
		},
		skills: {
			type: "array",
			items: {
				$ref: "#/definitions/playerSkill",
			},
		},
	};

	const ratings = bySport({
		baseball: [
			"hgt",
			"spd",
			"hpw",
			"con",
			"eye",
			"gnd",
			"fly",
			"thr",
			"cat",
			"ppw",
			"ctl",
			"mov",
			"endu",
		],
		basketball: [
			"dnk",
			"drb",
			"endu",
			"fg",
			"ft",
			"hgt",
			"ins",
			"jmp",
			"pss",
			"reb",
			"spd",
			"stre",
			"tp",
		],
		football: [
			"hgt",
			"stre",
			"spd",
			"endu",
			"thv",
			"thp",
			"tha",
			"bsc",
			"elu",
			"rtr",
			"hnd",
			"rbk",
			"pbk",
			"pcv",
			"tck",
			"prs",
			"rns",
			"kpw",
			"kac",
			"ppw",
			"pac",
		],
		hockey: [
			"hgt",
			"stre",
			"spd",
			"endu",
			"pss",
			"wst",
			"sst",
			"stk",
			"oiq",
			"chk",
			"blk",
			"fcf",
			"diq",
			"glk",
		],
	});

	// These should be validated for their numeric value, but not required because different versions of the schema might not have them
	const oldRatings = sport === "basketball" ? ["blk", "stl"] : [];
	const newRatings = sport === "basketball" ? ["diq", "oiq"] : [];

	for (const rating of [...ratings, ...oldRatings, ...newRatings]) {
		properties[rating] = {
			type: "number",
			minimum: 0,
			maximum: 100,
		};
	}

	return {
		items: {
			type: "object",
			properties,
			required: ratings,
		},
	};
};

const wrap = child => ({
	anyOf: [
		{
			type: "array",
			minItems: 1,
			items: {
				type: "object",
				properties: {
					start: {
						anyOf: [
							{
								type: "null",
							},
							{
								type: "integer",
							},
						],
					},
					value: child,
				},
				required: ["start", "value"],
			},
		},
		child,
	],
});

const generateJSONSchema = (sport /*: string*/) => {
	if (sport === "test") {
		return {
			$schema: "http://json-schema.org/draft-07/schema#",
			$id: "https://play.basketball-gm.com/files/league-schema.json",
			title: "Test GM League File Schema",
			description: "Test only!",
			definitions: {},
			type: "object",
			properties: {},
		};
	}

	const depth = bySport({
		baseball: {
			depth: {
				type: "object",
				properties: {
					L: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					LP: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					D: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					DP: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					P: {
						type: "array",
						items: {
							type: "integer",
						},
					},
				},
				required: ["L", "LP", "D", "DP", "P"],
			},
		},
		basketball: {},
		football: {
			depth: {
				type: "object",
				properties: {
					QB: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					RB: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					WR: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					TE: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					OL: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					DL: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					LB: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					CB: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					S: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					K: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					P: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					KR: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					PR: {
						type: "array",
						items: {
							type: "integer",
						},
					},
				},
				required: [
					"QB",
					"RB",
					"WR",
					"TE",
					"OL",
					"DL",
					"LB",
					"CB",
					"S",
					"K",
					"P",
					"KR",
					"PR",
				],
			},
		},
		hockey: {
			depth: {
				type: "object",
				properties: {
					F: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					D: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					G: {
						type: "array",
						items: {
							type: "integer",
						},
					},
				},
				required: ["F", "D", "G"],
			},
		},
	});

	const websitePlay = bySport({
		baseball: "baseball.zengm.com",
		basketball: "play.basketball-gm.com",
		football: "play.football-gm.com",
		hockey: "hockey.zengm.com",
	});

	return {
		$schema: "http://json-schema.org/draft-07/schema#",
		$id: `https://${websitePlay}/files/league-schema.json`,
		title: `${bySport({
			baseball: "ZenGM Baseball",
			basketball: "Basketball GM",
			football: "Footbal lGM",
			hockey: "ZenGM Hockey",
		})} League File Schema`,
		description: `For use at https://${websitePlay}/`,

		definitions: {
			budgetItem: {
				type: "object",
				properties: {
					amount: {
						type: "number",
						minimum: 0,
					},
					rank: {
						type: "number",
						minimum: 1,
					},
				},
				required: ["amount", "rank"],
			},
			playerContract: {
				type: "object",
				properties: {
					amount: {
						type: "number",
						minimum: 0,
					},
					exp: {
						type: "number",
					},
					rookie: {
						const: true,
					},
					rookieResign: {
						const: true,
					},
				},
				required: ["amount", "exp"],
			},
			playerInjury: {
				type: "object",
				properties: {
					gamesRemaining: {
						type: "integer",
						minimum: 0,
					},
					type: {
						type: "string",
					},
				},
				required: ["gamesRemaining", "type"],
			},
			playoffSeriesTeam: {
				type: "object",
				properties: {
					cid: {
						type: "integer",
					},
					seed: {
						type: "integer",
						minimum: 1,
					},
					tid: {
						type: "integer",
					},
					won: {
						type: "integer",
						minimum: 0,
					},
				},
				required: ["cid", "seed", "tid", "won"],
			},
			playerSkill: {
				type: "string",
				enum: bySport({
					baseball: [
						"Pp",
						"Pf",
						"Pw",
						"Ro",
						"Ri",
						"D1",
						"Dc",
						"Dg",
						"Df",
						"A",
						"Hp",
						"Hc",
						"E",
						"S",
					],
					basketball: ["3", "A", "B", "Di", "Dp", "Po", "Ps", "R", "V"],
					football: [
						"Pa",
						"Pd",
						"Ps",
						"A",
						"X",
						"H",
						"Bp",
						"Br",
						"PR",
						"RS",
						"L",
					],
					hockey: ["Pm", "Pw", "G", "E", "S"],
				}),
			},
			tradeTeam: {
				type: "object",
				properties: {
					dpids: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					pids: {
						type: "array",
						items: {
							type: "integer",
						},
					},
					tid: {
						type: "integer",
					},
				},
				required: ["dpids", "pids", "tid"],
			},
			div: {
				type: "object",
				properties: {
					did: {
						type: "integer",
					},
					cid: {
						type: "integer",
					},
					name: {
						type: "string",
					},
				},
				required: ["did", "cid", "name"],
			},
			conf: {
				type: "object",
				properties: {
					cid: {
						type: "integer",
					},
					name: {
						type: "string",
					},
				},
				required: ["cid", "name"],
			},
		},

		type: "object",

		properties: {
			version: {
				type: "integer",
			},
			startingSeason: {
				type: "integer",
			},
			awards: {
				type: "array",
				items: {
					type: "object",
					properties: {},
				},
			},
			draftPicks: {
				type: "array",
				items: {
					type: "object",
					properties: {
						dpid: {
							type: "integer",
						},
						tid: {
							type: "integer",
						},
						originalTid: {
							type: "integer",
						},
						round: {
							type: "integer",
							minimum: 1,
						},
						pick: {
							type: "integer",
							minimum: 0,
						},
						season: {
							anyOf: [
								{
									type: "integer",
								},
								{
									type: "string",
								},
							],
						},
					},
					required: ["tid", "originalTid", "round", "season"],
				},
			},
			draftLotteryResults: {
				type: "array",
				items: {
					type: "object",
					properties: {
						season: {
							type: "integer",
						},
						result: {
							type: "array",
							items: {
								type: "object",
								properties: {
									tid: {
										type: "integer",
									},
									originalTid: {
										type: "integer",
									},
									chances: {
										type: "integer",
										minimum: 1,
									},
									pick: {
										type: "integer",
										minimum: 1,
									},
									won: {
										type: "integer",
										minimum: 0,
									},
									lost: {
										type: "integer",
										minimum: 0,
									},
								},
								required: ["tid", "originalTid", "chances", "won", "lost"],
							},
						},
					},
					required: ["season", "result"],
				},
			},
			events: {
				type: "array",
				items: {
					type: "object",
					properties: {},
				},
			},
			gameAttributes: {
				anyOf: [
					{
						type: "array",
					},
					{
						type: "object",
						properties: {
							aiJerseyRetirement: {
								type: "boolean",
							},
							aiTradesFactor: {
								type: "number",
							},
							allStarDunk: {
								type: "boolean",
							},
							allStarGame: {
								// boolean is legacy
								anyOf: [
									{
										type: "boolean",
									},
									{
										type: "number",
									},
									{
										type: "null",
									},
								],
							},
							allStarNum: {
								type: "number",
							},
							allStarThree: {
								type: "boolean",
							},
							allStarType: {
								type: "string",
								enum: ["draft", "byConf", "top"],
							},
							autoDeleteOldBoxScores: {
								type: "boolean",
							},
							/*autoExpandProb: {
								type: "number",
								minimum: 0,
								maximum: 1,
							},
							autoExpandNumTeams: {
								type: "integer",
								minimum: 0,
							},
							autoExpandGeo: {
								type: "string",
								enum: ["naFirst", "naOnly", "any"],
							},*/
							autoRelocate: {
								properties: {
									phase: {
										const: "vote",
									},
									tid: {
										type: "integer",
										minimum: 0,
									},
									abbrev: {
										type: "string",
									},
									realigned: {
										type: "array",
										items: {
											type: "array",
											items: {
												type: "integer",
												minimum: 0,
											},
										},
									},
								},
								required: ["phase", "tid", "abbrev"],
							},
							autoRelocateProb: {
								type: "number",
								minimum: 0,
								maximum: 1,
							},
							autoRelocateGeo: {
								type: "string",
								enum: ["naFirst", "naOnly", "any"],
							},
							autoRelocateRealign: {
								type: "boolean",
							},
							autoRelocateRebrand: {
								type: "boolean",
							},
							brotherRate: {
								type: "number",
								minimum: 0,
							},
							budget: {
								type: "boolean",
							},
							challengeNoDraftPicks: {
								type: "boolean",
							},
							challengeNoFreeAgents: {
								type: "boolean",
							},
							challengeNoRatings: {
								type: "boolean",
							},
							challengeNoTrades: {
								type: "boolean",
							},
							challengeLoseBestPlayer: {
								type: "boolean",
							},
							challengeFiredLuxuryTax: {
								type: "boolean",
							},
							challengeFiredMissPlayoffs: {
								type: "boolean",
							},
							challengeSisyphusMode: {
								type: "boolean",
							},
							challengeThanosMode: {
								anyOf: [
									{
										type: "boolean",
									},
									{
										type: "number",
									},
								],
							},
							confs: wrap({
								type: "array",
								minItems: 1,
								items: {
									$ref: "#/definitions/conf",
								},
							}),
							daysLeft: {
								type: "integer",
								minimum: 0,
							},
							defaultStadiumCapacity: {
								type: "integer",
								minimum: 0,
							},

							dh: {
								anyOf: [
									{
										type: "string",
										enum: ["all", "none"],
									},
									{
										type: "array",
										items: {
											type: "integer",
											minimum: 0,
										},
									},
								],
							},
							difficulty: {
								type: "number",
							},
							divs: wrap({
								type: "array",
								minItems: 1,
								items: {
									$ref: "#/definitions/div",
								},
							}),
							draftAges: {
								type: "array",
								items: {
									type: "integer",
								},
								minItems: 2,
								maxItems: 2,
							},
							draftPickAutoContract: {
								type: "boolean",
							},
							draftPickAutoContractPercent: {
								type: "number",
								minimum: 0,
							},
							draftPickAutoContractRounds: {
								type: "integer",
								minimum: 0,
							},
							draftType: {
								type: "string",
								// nba is legacy
								enum: [
									"nba1994",
									"nba2019",
									"noLottery",
									"noLotteryReverse",
									"random",
									"nba1990",
									"randomLotteryFirst3",
									"randomLottery",
									"coinFlip",
									"nba",
									"freeAgents",
									"nhl2017",
									"nhl2021",
									"mlb2022",
									"custom",
								],
							},
							draftLotteryCustomChances: {
								type: "array",
								items: {
									type: "number",
								},
							},
							draftLotteryCustomNumPicks: {
								type: "integer",
								minimum: 0,
							},
							elam: {
								type: "boolean",
							},
							elamASG: {
								type: "boolean",
							},
							elamMinutes: {
								type: "number",
								minimum: 0,
							},
							elamOvertime: {
								type: "boolean",
							},
							elamPoints: {
								type: "integer",
								minimum: 0,
							},
							equalizeRegions: {
								type: "boolean",
							},
							forceRetireAge: {
								type: "integer",
							},
							foulsNeededToFoulOut: {
								type: "integer",
								minimum: 0,
							},
							foulsUntilBonus: {
								type: "array",
								items: {
									type: "integer",
								},
								minItems: 3,
								maxItems: 3,
							},
							foulRateFactor: {
								type: "number",
							},
							gameOver: {
								type: "boolean",
							},
							gender: {
								type: "string",
								enum: ["female", "male"],
							},
							godMode: {
								type: "boolean",
							},
							godModeInPast: {
								type: "boolean",
							},
							goatFormula: {
								type: "string",
							},
							goatSeasonFormula: {
								type: "string",
							},
							gracePeriodEnd: {
								type: "integer",
							},
							groupScheduleSeries: {
								type: "boolean",
							},
							heightFactor: {
								type: "number",
							},
							hideDisabledTeams: {
								type: "boolean",
							},
							hofFactor: {
								type: "number",
							},
							homeCourtAdvantage: {
								type: "number",
							},
							inflationAvg: {
								type: "number",
							},
							inflationMax: {
								type: "number",
							},
							inflationMin: {
								type: "number",
							},
							inflationStd: {
								type: "number",
							},
							injuries: {
								type: "array",
								items: {
									type: "object",
									properties: {
										name: {
											type: "string",
										},
										frequency: {
											type: "number",
										},
										games: {
											type: "number",
										},
									},
									required: ["name", "frequency", "games"],
								},
							},
							injuryRate: {
								type: "number",
								minimum: 0,
							},
							lid: {
								type: "integer",
							},
							lowestDifficulty: {
								type: "number",
							},
							luxuryPayroll: {
								type: "integer",
								minimum: 0,
							},
							luxuryTax: {
								type: "number",
								minimum: 0,
							},
							maxContract: {
								type: "integer",
								minimum: 0,
							},
							maxContractLength: {
								type: "integer",
								minimum: 1,
							},
							maxRosterSize: {
								type: "integer",
								minimum: 0,
							},
							minContract: {
								type: "integer",
								minimum: 0,
							},
							minContractLength: {
								type: "integer",
								minimum: 1,
							},
							minPayroll: {
								type: "integer",
								minimum: 0,
							},
							minRetireAge: {
								type: "integer",
							},
							minRosterSize: {
								type: "integer",
								minimum: 0,
							},
							names: {
								type: "object",
								properties: {
									first: {},
									last: {},
								},
								required: ["first", "last"],
							},
							numWatchColors: {
								type: "integer",
							},
							otherTeamsWantToHire: {
								type: "boolean",
							},
							playerBioInfo: {
								type: "object",
								properties: {
									countries: {
										type: "object",
									},
									default: {
										type: "object",
										properties: {
											colleges: {
												type: "object",
											},
											fractionSkipCollege: {
												type: "number",
											},
										},
									},
									frequencies: {
										type: "object",
									},
								},
							},
							playIn: {
								type: "boolean",
							},
							playerMoodTraits: {
								type: "boolean",
							},
							pointsFormula: wrap({
								type: "string",
							}),
							nextPhase: {
								// Shouldn't actually be null, but legacy
								anyOf: [
									{
										type: "integer",
									},
									{
										type: "null",
									},
								],
							},
							numDraftPicksCurrent: {
								type: "integer",
								minimum: 0,
							},
							numDraftRounds: {
								type: "integer",
								minimum: 0,
							},
							numGames: {
								type: "integer",
								minimum: 0,
							},
							numGamesDiv: {
								anyOf: [
									{
										type: "integer",
										minimum: 0,
									},
									{
										type: "null",
									},
								],
							},
							numGamesConf: {
								anyOf: [
									{
										type: "integer",
										minimum: 0,
									},
									{
										type: "null",
									},
								],
							},
							numGamesPlayoffSeries: wrap({
								type: "array",
								items: {
									type: "integer",
									minimum: 1,
								},
							}),
							numPlayersDunk: {
								type: "integer",
								minimum: 2,
							},
							numPlayersOnCourt: {
								type: "integer",
								minimum: 1,
							},
							numPlayersThree: {
								type: "integer",
								minimum: 2,
							},
							numPlayoffByes: wrap({
								type: "integer",
							}),
							numSeasonsFutureDraftPicks: {
								type: "integer",
								minimum: 0,
							},
							numTeams: {
								type: "integer",
								minimum: 0,
							},
							phase: {
								type: "integer",
								minimum: -2,
								maximum: 8,
							},
							playoffsByConf: {
								type: "boolean",
							},
							playoffsNumTeamsDiv: wrap({
								type: "integer",
								minimum: 0,
							}),
							playoffsReseed: {
								type: "boolean",
							},
							playersRefuseToNegotiate: {
								type: "boolean",
							},
							quarterLength: {
								type: "number",
								minimum: 0,
							},
							numPeriods: {
								type: "number",
								minimum: 0,
							},
							randomDebutsForever: {
								type: "integer",
								minimum: 1,
							},
							realDraftRatings: {
								type: "string",
							},
							realPlayerDeterminism: {
								type: "number",
								minimum: 0,
								maximum: 1,
							},
							repeatSeason: {
								type: "object",
							},
							riggedLootery: {
								type: "array",
								items: {
									anyOf: [
										{
											type: "integer",
										},
										{
											type: "null",
										},
									],
								},
							},
							rookieContractLengths: {
								type: "array",
								items: {
									type: "integer",
								},
								minItems: 1,
							},
							rookiesCanRefuse: {
								type: "boolean",
							},
							salaryCap: {
								type: "integer",
								minimum: 0,
							},
							salaryCapType: {
								type: "string",
								enum: ["hard", "none", "soft"],
							},
							season: {
								type: "integer",
							},
							softCapTradeSalaryMatch: {
								type: "number",
								minimum: 0,
							},
							sonRate: {
								type: "number",
								minimum: 0,
							},
							spectator: {
								type: "boolean",
							},
							startingSeason: {
								type: "integer",
							},
							stopOnInjury: {
								type: "boolean",
							},
							stopOnInjuryGames: {
								type: "integer",
							},
							tiebreakers: {
								type: "array",
								minItems: 1,
							},
							ties: wrap({
								type: "boolean",
							}),
							otl: wrap({
								type: "boolean",
							}),
							thanosCooldownEnd: {
								type: "number",
							},
							tradeDeadline: {
								type: "number",
							},
							tragicDeathRate: {
								type: "number",
								minimum: 0,
							},
							tragicDeaths: {
								type: "array",
								items: {
									type: "object",
									properties: {
										reason: {
											type: "string",
										},
										frequency: {
											type: "number",
										},
									},
									required: ["reason", "frequency"],
								},
							},
							userTid: wrap({
								type: "integer",
							}),
							userTids: {
								type: "array",
								items: {
									type: "integer",
									minimum: 0,
								},
								minItems: 1,
							},
							weightFactor: {
								type: "number",
							},
							threePointers: {
								type: "boolean",
							},
							threePointTendencyFactor: {
								type: "number",
							},
							threePointAccuracyFactor: {
								type: "number",
							},
							twoPointAccuracyFactor: {
								type: "number",
							},
							blockFactor: {
								type: "number",
							},
							stealFactor: {
								type: "number",
							},
							turnoverFactor: {
								type: "number",
							},
							orbFactor: {
								type: "number",
							},
							pace: {
								type: "number",
							},
							expansionDraft: {
								type: "object",
							},
							passFactor: {
								type: "number",
							},
							rushYdsFactor: {
								type: "number",
							},
							passYdsFactor: {
								type: "number",
							},
							completionFactor: {
								type: "number",
							},
							scrambleFactor: {
								type: "number",
							},
							sackFactor: {
								type: "number",
							},
							fumbleFactor: {
								type: "number",
							},
							intFactor: {
								type: "number",
							},
							fgAccuracyFactor: {
								type: "number",
							},
							fourthDownFactor: {
								type: "number",
							},
							onsideFactor: {
								type: "number",
							},
							onsideRecoveryFactor: {
								type: "number",
							},
							hitFactor: {
								type: "number",
							},
							giveawayFactor: {
								type: "number",
							},
							takeawayFactor: {
								type: "number",
							},
							deflectionFactor: {
								type: "number",
							},
							saveFactor: {
								type: "number",
							},
							assistFactor: {
								type: "number",
							},
							foulFactor: {
								type: "number",
							},
							groundFactor: {
								type: "number",
							},
							lineFactor: {
								type: "number",
							},
							flyFactor: {
								type: "number",
							},
							powerFactor: {
								type: "number",
							},
							throwOutFactor: {
								type: "number",
							},
							strikeFactor: {
								type: "number",
							},
							balkFactor: {
								type: "number",
							},
							wildPitchFactor: {
								type: "number",
							},
							passedBallFactor: {
								type: "number",
							},
							hitByPitchFactor: {
								type: "number",
							},
							swingFactor: {
								type: "number",
							},
							contactFactor: {
								type: "number",
							},
						},
					},
				],
			},
			games: {
				type: "array",
				items: {
					type: "object",
					properties: {
						att: {
							type: "integer",
						},
						gid: {
							type: "integer",
						},
						lost: {
							type: "object",
							properties: {
								tid: {
									type: "integer",
								},
								pts: {
									type: "integer",
								},
							},
							required: ["tid", "pts"],
						},
						playoffs: {
							type: "boolean",
						},
						overtimes: {
							type: "integer",
							minimum: 0,
						},
						season: {
							type: "integer",
						},
						teams: {
							type: "array",
							items: {},
							minItems: 2,
							maxItems: 2,
						},
						won: {
							type: "object",
							properties: {
								tid: {
									type: "integer",
								},
								pts: {
									type: "integer",
								},
							},
							required: ["tid", "pts"],
						},
					},
					required: [
						"att",
						"lost",
						"playoffs",
						"overtimes",
						"season",
						"teams",
						"won",
					],
				},
			},
			messages: {
				type: "array",
				items: {
					type: "object",
					properties: {
						mid: {
							type: "integer",
						},
						from: {
							type: "string",
						},
						read: {
							type: "boolean",
						},
						text: {
							type: "string",
						},
						year: {
							type: "integer",
						},
						subject: {
							type: "string",
						},
						ownerMoods: {
							type: "array",
							items: {
								type: "object",
								properties: {
									wins: {
										type: "number",
									},
									playoffs: {
										type: "number",
									},
									money: {
										type: "number",
									},
								},
								required: ["wins", "playoffs", "money"],
							},
						},
					},
					required: ["from", "read", "text", "year"],
				},
			},
			negotiations: {
				type: "array",
				items: {
					type: "object",
					properties: {
						pid: {
							type: "integer",
						},
						tid: {
							type: "integer",
						},
						resigning: {
							type: "boolean",
						},
					},
					required: ["pid", "tid", "resigning"],
				},
			},
			playerFeats: {
				type: "array",
				items: {
					type: "object",
					properties: {
						fid: {
							type: "integer",
						},
						pid: {
							type: "integer",
						},
						name: {
							type: "string",
						},
						pos: {
							type: "string",
						},
						season: {
							type: "integer",
						},
						tid: {
							type: "integer",
						},
						oppTid: {
							type: "integer",
						},
						playoffs: {
							type: "boolean",
						},
						gid: {
							type: "integer",
						},
						stats: {},
						won: {
							type: "boolean",
						},
						score: {
							type: "string",
						},
						overtimes: {
							type: "integer",
							minimum: 0,
						},
					},
					required: [
						"pid",
						"name",
						"pos",
						"season",
						"tid",
						"oppTid",
						"playoffs",
						"gid",
						"stats",
						"won",
						"score",
						"overtimes",
					],
				},
			},
			players: {
				type: "array",
				items: {
					type: "object",
					properties: {
						awards: {
							type: "array",
							items: {
								type: "object",
								properties: {
									season: {
										type: "integer",
									},
									type: {
										type: "string",
									},
								},
								required: ["season", "type"],
							},
						},
						born: {
							type: "object",
							properties: {
								year: {
									type: "integer",
								},
								loc: {
									type: "string",
								},
							},
							required: ["year", "loc"],
						},
						college: {
							type: "string",
						},
						contract: {
							$ref: "#/definitions/playerContract",
						},
						diedYear: {
							type: "integer",
						},
						draft: {
							type: "object",
							properties: {
								round: {
									type: "integer",
								},
								pick: {
									type: "integer",
								},
								tid: {
									type: "integer",
								},
								originalTid: {
									type: "integer",
								},
								year: {
									type: "integer",
								},
								pot: {
									type: "integer",
								},
								ovr: {
									type: "integer",
								},
								skills: {
									type: "array",
									items: {
										$ref: "#/definitions/playerSkill",
									},
								},
							},
							required: ["year"],
						},
						face: {},
						firstName: {
							type: "string",
						},
						gamesUntilTradable: {
							type: "integer",
						},
						hgt: {
							type: "number",
						},
						hof: {
							anyOf: [
								{
									type: "boolean",
								},
								{
									const: 1,
								},
							],
						},
						imgURL: {
							type: "string",
						},
						injuries: {
							type: "array",
							items: {
								type: "object",
								properties: {
									season: {
										type: "integer",
									},
									games: {
										type: "integer",
									},
									type: {
										type: "string",
									},
									ovrDrop: {
										type: "integer",
									},
									potDrop: {
										type: "integer",
									},
								},
								required: ["season", "games", "type"],
							},
						},
						injury: {
							$ref: "#/definitions/playerInjury",
						},
						jerseyNumber: {
							type: "string",
						},
						lastName: {
							type: "string",
						},
						moodTraits: {
							type: "array",
							items: {
								type: "string",
							},
						},
						name: {
							type: "string",
						},
						note: {
							type: "string",
						},
						noteBool: {
							const: 1,
						},
						numDaysFreeAgent: {
							type: "integer",
							minimum: 0,
						},
						pid: {
							type: "integer",
						},
						pos: {
							type: "string",
						},
						ptModifier: {
							type: "number",
						},
						ratings: {
							type: "array",
							...genRatings(sport),
						},
						relatives: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										enum: ["brother", "father", "son"],
									},
									pid: {
										type: "integer",
									},
									name: {
										type: "string",
									},
								},
								required: ["type", "pid", "name"],
							},
						},
						retiredYear: {
							anyOf: [
								{
									type: "integer",
								},
								{
									type: "null",
								},
							],
						},
						rosterOrder: {
							type: "integer",
						},
						salaries: {
							type: "array",
							items: {
								type: "object",
								properties: {
									amount: {
										type: "number",
									},
									season: {
										type: "integer",
									},
								},
								required: ["amount", "season"],
							},
						},
						srID: {
							type: "string",
						},
						stats: {
							type: "array",
							items: {
								type: "object",
								properties: {
									playoffs: {
										type: "boolean",
									},
									season: {
										type: "integer",
									},
									tid: {
										type: "integer",
									},
								},
								required: ["playoffs", "season", "tid"],
							},
						},
						statsTids: {
							type: "array",
							items: {
								type: "number",
							},
						},
						tid: {
							type: "integer",
						},
						transactions: {
							type: "array",
							items: {
								type: "object",
								properties: {
									season: {
										type: "integer",
									},
									phase: {
										type: "integer",
									},
									tid: {
										type: "integer",
									},
									type: {
										type: "string",
										enum: ["draft", "freeAgent", "trade", "godMode", "import"],
									},
									pickNum: {
										type: "integer",
									},
									fromTid: {
										type: "integer",
									},
									eid: {
										type: "integer",
									},
								},
								required: ["season", "phase", "tid", "type"],
							},
						},
						value: {
							type: "number",
						},
						valueNoPot: {
							type: "number",
						},
						valueFuzz: {
							type: "number",
						},
						valueNoPotFuzz: {
							type: "number",
						},
						watch: {
							anyOf: [
								{
									type: "boolean",
								},
								{
									type: "number",
								},
							],
						},
						weight: {
							anyOf: [
								{
									type: "number",
								},
								{
									type: "null",
								},
							],
						},
						yearsFreeAgent: {
							type: "integer",
						},
					},
					required: ["ratings", "tid"],
				},
			},
			playoffSeries: {
				type: "array",
				items: {
					type: "object",
					properties: {
						season: {
							type: "integer",
						},
						currentRound: {
							type: "integer",
							minimum: -1,
						},
						series: {
							type: "array",
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										home: {
											$ref: "#/definitions/playoffSeriesTeam",
										},
										away: {
											$ref: "#/definitions/playoffSeriesTeam",
										},
										gids: {
											type: "array",
											items: {
												type: "integer",
											},
										},
									},
									required: ["home"],
								},
							},
						},
					},
					required: ["season", "currentRound", "series"],
				},
			},
			releasedPlayers: {
				type: "array",
				items: {
					type: "object",
					properties: {
						rid: {
							type: "integer",
						},
						pid: {
							type: "integer",
						},
						tid: {
							type: "integer",
						},
						contract: {
							// Don't use #/definitions/playerContract because that requires positive amount, but some people use a negative amount here for various purposes
							type: "object",
							properties: {
								amount: {
									type: "number",
								},
								exp: {
									type: "number",
								},
							},
							required: ["amount", "exp"],
						},
					},
					required: ["pid", "tid", "contract"],
				},
			},
			schedule: {
				type: "array",
				items: {
					type: "object",
					properties: {
						awayTid: {
							type: "integer",
						},
						homeTid: {
							type: "integer",
						},
					},
					required: ["awayTid", "homeTid"],
				},
			},
			scheduledEvents: {
				type: "array",
				items: {
					type: "object",
					properties: {
						id: {
							type: "integer",
						},
						type: {
							type: "string",
						},
						season: {
							type: "integer",
						},
						phase: {
							type: "integer",
						},
						info: {
							type: "object",
						},
					},
					required: ["type", "season", "phase", "info"],
				},
			},
			seasonLeaders: {
				type: "array",
				items: {
					type: "object",
					properties: {
						season: {
							type: "integer",
						},
						age: {
							type: "integer",
						},
						regularSeason: {
							type: "object",
						},
						playoffs: {
							type: "object",
						},
						ratings: {
							type: "object",
						},
						ratingsFuzz: {
							type: "object",
						},
					},
					required: [
						"season",
						"age",
						"regularSeason",
						"playoffs",
						"ratings",
						"ratingsFuzz",
					],
				},
			},
			teams: {
				type: "array",
				items: {
					type: "object",
					properties: {
						tid: {
							type: "integer",
						},
						cid: {
							type: "integer",
						},
						did: {
							type: "integer",
						},
						region: {
							type: "string",
						},
						name: {
							type: "string",
						},
						abbrev: {
							type: "string",
						},
						imgURL: {
							type: "string",
						},
						budget: {
							anyOf: [
								{
									type: "object",
									properties: {
										ticketPrice: {
											$ref: "#/definitions/budgetItem",
										},
										scouting: {
											$ref: "#/definitions/budgetItem",
										},
										coaching: {
											$ref: "#/definitions/budgetItem",
										},
										health: {
											$ref: "#/definitions/budgetItem",
										},
										facilities: {
											$ref: "#/definitions/budgetItem",
										},
									},
									required: [
										"ticketPrice",
										"scouting",
										"coaching",
										"health",
										"facilities",
									],
								},
								{
									type: "object",
									properties: {
										ticketPrice: {
											type: "number",
											minimum: 0,
										},
										scouting: {
											type: "integer",
											minimum: 1,
											maximum: 100,
										},
										coaching: {
											type: "integer",
											minimum: 1,
											maximum: 100,
										},
										health: {
											type: "integer",
											minimum: 1,
											maximum: 100,
										},
										facilities: {
											type: "integer",
											minimum: 1,
											maximum: 100,
										},
									},
									required: [
										"ticketPrice",
										"scouting",
										"coaching",
										"health",
										"facilities",
									],
								},
							],
						},
						initialBudget: {
							type: "object",
							properties: {
								scouting: {
									type: "integer",
									minimum: 1,
									maximum: 100,
								},
								coaching: {
									type: "integer",
									minimum: 1,
									maximum: 100,
								},
								health: {
									type: "integer",
									minimum: 1,
									maximum: 100,
								},
								facilities: {
									type: "integer",
									minimum: 1,
									maximum: 100,
								},
							},
							required: ["scouting", "coaching", "health", "facilities"],
						},
						strategy: {},
						pop: {
							type: "number",
							minimum: 0,
						},
						stadiumCapacity: {
							type: "integer",
							minimum: 0,
						},
						colors: {
							type: "array",
							items: {
								type: "string",
							},
							maxItems: 3,
							minItems: 3,
						},
						retiredJerseyNumbers: {
							type: "array",
							items: {
								type: "object",
								properties: {
									number: {
										type: "string",
									},
									seasonRetired: {
										type: "number",
									},
									seasonTeamInfo: {
										type: "number",
									},
									pid: {
										type: "number",
									},
									name: {
										type: "string",
									},
									text: {
										type: "string",
									},
								},
								required: ["number", "seasonRetired", "seasonTeamInfo", "text"],
							},
						},
						srID: {
							type: "string",
						},
						seasons: {
							type: "array",
							items: {
								type: "object",
								properties: {
									tid: {
										type: "integer",
									},
									cid: {
										type: "integer",
									},
									did: {
										type: "integer",
									},
									region: {
										type: "string",
									},
									name: {
										type: "string",
									},
									abbrev: {
										type: "string",
									},
									imgURL: {
										type: "string",
									},
									season: {
										type: "integer",
									},
									gpHome: {
										type: "integer",
										minimum: 0,
									},
									att: {
										type: "integer",
										minimum: 0,
									},
									cash: {
										type: "number",
									},
									won: {
										type: "integer",
										minimum: 0,
									},
									lost: {
										type: "integer",
										minimum: 0,
									},
									tied: {
										type: "integer",
										minimum: 0,
									},
									otl: {
										type: "integer",
										minimum: 0,
									},
									wonHome: {
										type: "integer",
										minimum: 0,
									},
									lostHome: {
										type: "integer",
										minimum: 0,
									},
									tiedHome: {
										type: "integer",
										minimum: 0,
									},
									otlHome: {
										type: "integer",
										minimum: 0,
									},
									wonAway: {
										type: "integer",
										minimum: 0,
									},
									lostAway: {
										type: "integer",
										minimum: 0,
									},
									tiedAway: {
										type: "integer",
										minimum: 0,
									},
									otlAway: {
										type: "integer",
										minimum: 0,
									},
									wonDiv: {
										type: "integer",
										minimum: 0,
									},
									lostDiv: {
										type: "integer",
										minimum: 0,
									},
									tiedDiv: {
										type: "integer",
										minimum: 0,
									},
									otlDiv: {
										type: "integer",
										minimum: 0,
									},
									wonConf: {
										type: "integer",
										minimum: 0,
									},
									otlConf: {
										type: "integer",
										minimum: 0,
									},
									lostConf: {
										type: "integer",
										minimum: 0,
									},
									tiedConf: {
										type: "integer",
										minimum: 0,
									},
									lastTen: {
										type: "array",
										items: {
											anyOf: [
												{
													type: "integer",
												},
												{
													type: "string",
												},
											],
											enum: [-1, 0, 1, "OTL"],
										},
									},
									streak: {
										type: "integer",
									},
									playoffRoundsWon: {
										type: "integer",
										minimum: -1,
									},
									hype: {
										type: "number",
										minimum: 0,
										maximum: 1,
									},
									pop: {
										type: "number",
										minimum: 0,
									},
									stadiumCapacity: {
										type: "integer",
										minimum: 0,
									},
									revenues: {
										anyOf: [
											{
												type: "object",
												properties: {
													luxuryTaxShare: {
														$ref: "#/definitions/budgetItem",
													},
													merch: {
														$ref: "#/definitions/budgetItem",
													},
													sponsor: {
														$ref: "#/definitions/budgetItem",
													},
													ticket: {
														$ref: "#/definitions/budgetItem",
													},
													nationalTv: {
														$ref: "#/definitions/budgetItem",
													},
													localTv: {
														$ref: "#/definitions/budgetItem",
													},
												},
												required: [
													"luxuryTaxShare",
													"merch",
													"sponsor",
													"ticket",
													"nationalTv",
													"localTv",
												],
											},
											{
												type: "object",
												properties: {
													luxuryTaxShare: {
														type: "number",
														minimum: 0,
													},
													merch: {
														type: "number",
														minimum: 0,
													},
													sponsor: {
														type: "number",
														minimum: 0,
													},
													ticket: {
														type: "number",
														minimum: 0,
													},
													nationalTv: {
														type: "number",
														minimum: 0,
													},
													localTv: {
														type: "number",
														minimum: 0,
													},
												},
												required: [
													"luxuryTaxShare",
													"merch",
													"sponsor",
													"ticket",
													"nationalTv",
													"localTv",
												],
											},
										],
									},
									expenses: {
										anyOf: [
											{
												type: "object",
												properties: {
													salary: {
														$ref: "#/definitions/budgetItem",
													},
													luxuryTax: {
														$ref: "#/definitions/budgetItem",
													},
													minTax: {
														$ref: "#/definitions/budgetItem",
													},
													scouting: {
														$ref: "#/definitions/budgetItem",
													},
													coaching: {
														$ref: "#/definitions/budgetItem",
													},
													health: {
														$ref: "#/definitions/budgetItem",
													},
													facilities: {
														$ref: "#/definitions/budgetItem",
													},
												},
												required: [
													"salary",
													"luxuryTax",
													"minTax",
													"scouting",
													"coaching",
													"health",
													"facilities",
												],
											},
											{
												type: "object",
												properties: {
													salary: {
														type: "number",
														minimum: 0,
													},
													luxuryTax: {
														type: "number",
														minimum: 0,
													},
													minTax: {
														type: "number",
														minimum: 0,
													},
													scouting: {
														type: "number",
														minimum: 0,
													},
													coaching: {
														type: "number",
														minimum: 0,
													},
													health: {
														type: "number",
														minimum: 0,
													},
													facilities: {
														type: "number",
														minimum: 0,
													},
												},
												required: [
													"salary",
													"luxuryTax",
													"minTax",
													"scouting",
													"coaching",
													"health",
													"facilities",
												],
											},
										],
									},
									expenseLevels: {
										type: "object",
										properties: {
											scouting: {
												type: "number",
												minimum: 0,
											},
											coaching: {
												type: "number",
												minimum: 0,
											},
											health: {
												type: "number",
												minimum: 0,
											},
											facilities: {
												type: "number",
												minimum: 0,
											},
										},
										required: ["scouting", "coaching", "health", "facilities"],
									},
									payrollEndOfSeason: {
										type: "integer",
									},
									ownerMood: {
										type: "object",
										properties: {
											wins: {
												type: "number",
											},
											playoffs: {
												type: "number",
											},
											money: {
												type: "number",
											},
										},
										required: ["wins", "playoffs", "money"],
									},
									numPlayersTradedAway: {
										type: "number",
										minimum: 0,
									},
									avgAge: {
										type: "number",
									},
									ovrStart: {
										type: "number",
									},
									ovrEnd: {
										type: "number",
									},
								},
								required: ["season"],
							},
						},
						stats: {
							type: "array",
							items: {
								type: "object",
								properties: {},
							},
						},
						firstSeasonAfterExpansion: {
							type: "integer",
						},
						adjustForInflation: {
							type: "boolean",
						},
						disabled: {
							type: "boolean",
						},
						keepRosterSorted: {
							type: "boolean",
						},
						...depth,
					},
					required: ["cid", "did", "region", "name", "abbrev"],
				},
			},
			trade: {
				type: "array",
				items: {
					type: "object",
					properties: {
						rid: {
							type: "integer",
							minimum: 0,
							maximum: 0,
						},
						teams: {
							type: "array",
							items: [
								{
									$ref: "#/definitions/tradeTeam",
								},
								{
									$ref: "#/definitions/tradeTeam",
								},
							],
							minItems: 2,
							maxItems: 2,
						},
					},
					required: ["rid", "teams"],
				},
				maxItems: 1,
			},
		},
	};
};

export default generateJSONSchema;
