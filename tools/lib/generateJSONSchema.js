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
				ref: "#/definitions/playerSkill",
			},
		},
	};

	const ratings =
		sport === "basketball"
			? [
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
			  ]
			: [
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
			  ];

	// These should be validated for their numeric value, but not required because different versions of the schema might not have them
	const oldRatings = sport === "basketball" ? ["blk", "stl"] : [];
	const newRatings = sport === "basketball" ? ["diq", "oiq"] : [];

	for (const rating of [...ratings, oldRatings, newRatings]) {
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

const gameAttribute = (key, value, valueNotRequired) => {
	return {
		type: "object",
		properties: {
			key: {
				const: key,
			},
			value,
		},
		required: valueNotRequired ? ["key"] : ["key", "value"],
	};
};

const generateJSONSchema = (sport /*: string*/) => {
	if (sport === "test") {
		return {
			$schema: "http://json-schema.org/draft-07/schema#",
			$id: "https://play.basketball-gm.com/files/league-schema.json",
			title: "Test GM League File Schema",
			description: "Test only!",
		};
	}

	const upperCaseFirstLetterSport = `${sport
		.charAt(0)
		.toUpperCase()}${sport.slice(1)}`;

	const depth = {};
	if (sport === "football") {
		depth.depth = {
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
		};
	}

	return {
		$schema: "http://json-schema.org/draft-07/schema#",
		$id: `https://play.${sport}-gm.com/files/league-schema.json`,
		title: `${upperCaseFirstLetterSport} GM League File Schema`,
		description: `For use at https://play.${sport}-gm.com/`,

		definitions: {
			budgetItem: {
				type: "object",
				properties: {
					amount: {
						type: "number",
						minimum: 0,
					},
					rank: {
						type: "integer",
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
						exclusiveMinimum: 0,
					},
					exp: {
						type: "string",
					},
				},
				required: ["amount", "exp"],
			},
			playerInjury: {
				type: "object",
				properties: {
					gamesRemaining: {
						type: "integer",
						exclusiveMinimum: 0,
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
					winp: {
						type: "number",
						minimum: 0,
						maximum: 1,
					},
					won: {
						type: "integer",
						minimum: 0,
					},
				},
				required: ["cid", "seed", "tid", "winp", "won"],
			},
			playerSkill: {
				type: "string",
				enum: ["3", "A", "B", "Di", "Dp", "Po", "Ps", "R"],
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
							type: ["integer", "string"],
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
				type: "array",
				items: {
					oneOf: [
						gameAttribute("aiJerseyRetirement", { type: "boolean" }),
						gameAttribute("keepRosterSorted", { type: "boolean" }),
						gameAttribute("aiTradesFactor", { type: "number" }),
						gameAttribute("allStarGame", { type: "boolean" }),
						gameAttribute("autoDeleteOldBoxScores", { type: "boolean" }),
						gameAttribute("brotherRate", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("budget", { type: "boolean" }),
						gameAttribute("challengeNoDraftPicks", {
							type: "boolean",
						}),
						gameAttribute("challengeNoFreeAgents", {
							type: "boolean",
						}),
						gameAttribute("challengeNoRatings", {
							type: "boolean",
						}),
						gameAttribute("challengeNoTrades", {
							type: "boolean",
						}),
						gameAttribute("challengeLoseBestPlayer", {
							type: "boolean",
						}),
						gameAttribute("challengeFiredLuxuryTax", {
							type: "boolean",
						}),
						gameAttribute("challengeFiredMissPlayoffs", {
							type: "boolean",
						}),
						gameAttribute("confs", {
							type: "array",
							minItems: 1,
						}),
						gameAttribute("daysLeft", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("defaultStadiumCapacity", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("difficulty", {
							type: "number",
						}),
						gameAttribute("divs", {
							type: "array",
							minItems: 1,
						}),
						gameAttribute("draftType", {
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
							],
						}),
						gameAttribute("easyDifficultyInPast", {
							type: "boolean",
						}),
						gameAttribute("elam", {
							type: "boolean",
						}),
						gameAttribute("elamASG", {
							type: "boolean",
						}),
						gameAttribute("elamMinutes", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("elamPoints", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("equalizeRegions", {
							type: "boolean",
						}),
						gameAttribute("foulsNeededToFoulOut", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("foulRateFactor", {
							type: "number",
						}),
						gameAttribute("gameOver", {
							type: "boolean",
						}),
						gameAttribute("godMode", {
							type: "boolean",
						}),
						gameAttribute("godModeInPast", {
							type: "boolean",
						}),
						gameAttribute("gracePeriodEnd", {
							type: "integer",
						}),
						gameAttribute("hardCap", {
							type: "boolean",
						}),
						gameAttribute("homeCourtAdvantage", {
							type: "number",
						}),
						gameAttribute("injuryRate", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("leagueName", {
							type: "string",
						}),
						gameAttribute("lid", {
							type: "integer",
						}),
						gameAttribute("luxuryPayroll", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("luxuryTax", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("maxContract", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("maxContractLength", {
							type: "integer",
							minimum: 1,
						}),
						gameAttribute("maxRosterSize", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("minContract", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("minContractLength", {
							type: "integer",
							minimum: 1,
						}),
						gameAttribute("minPayroll", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("minRosterSize", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute(
							"names",
							{
								type: "object",
								properties: {
									first: {},
									last: {},
								},
								required: ["first", "last"],
							},
							true,
						),
						gameAttribute("otherTeamsWantToHire", {
							type: "boolean",
						}),
						gameAttribute(
							"playerBioInfo",
							{
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
							true,
						),
						gameAttribute("playerMoodTraits", {
							type: "boolean",
						}),
						gameAttribute(
							"nextPhase",
							{
								// Shouldn't actually be null, but legacy
								type: ["integer", "null"],
							},
							true,
						),
						gameAttribute("numDraftRounds", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("numGames", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("numGamesPlayoffSeries", {
							type: "array",
							minItems: 1,
						}),
						gameAttribute("numPlayersOnCourt", {
							type: "integer",
							minimum: 1,
						}),
						gameAttribute("numPlayoffByes", {
							type: ["integer", "array"],
						}),
						gameAttribute("numSeasonsFutureDraftPicks", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("numTeams", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("phase", {
							type: "integer",
							minimum: -2,
							maximum: 8,
						}),
						gameAttribute("playersRefuseToNegotiate", {
							type: "boolean",
						}),
						gameAttribute("quarterLength", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("realPlayerDeterminism", {
							type: "number",
							minimum: 0,
							maximum: 1,
						}),
						gameAttribute("repeatSeason", {
							type: "object",
						}),
						gameAttribute("rookieContractLengths", {
							type: "array",
							items: {
								type: "integer",
							},
							minItems: 1,
						}),
						gameAttribute("rookiesCanRefuse", {
							type: "boolean",
						}),
						gameAttribute("salaryCap", {
							type: "integer",
							minimum: 0,
						}),
						gameAttribute("season", {
							type: "integer",
						}),
						gameAttribute("sonRate", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("spectator", {
							type: "boolean",
						}),
						gameAttribute("startingSeason", {
							type: "integer",
						}),
						gameAttribute("stopOnInjury", {
							type: "boolean",
						}),
						gameAttribute("stopOnInjuryGames", {
							type: "integer",
						}),
						gameAttribute("ties", {
							type: ["boolean", "array"],
						}),
						gameAttribute("tradeDeadline", {
							type: "number",
						}),
						gameAttribute("tragicDeathRate", {
							type: "number",
							minimum: 0,
						}),
						gameAttribute("userTid", {
							type: ["integer", "array"],
						}),
						gameAttribute("userTids", {
							type: "array",
							items: {
								type: "integer",
							},
							minItems: 1,
						}),
						gameAttribute("threePointers", {
							type: "boolean",
						}),
						gameAttribute("threePointTendencyFactor", {
							type: "number",
						}),
						gameAttribute("threePointAccuracyFactor", {
							type: "number",
						}),
						gameAttribute("twoPointAccuracyFactor", {
							type: "number",
						}),
						gameAttribute("pace", {
							type: "number",
						}),
						gameAttribute("expansionDraft", {
							type: "object",
						}),

						// These are obsolete, just here for backwards compatbility
						...[
							"numPlayoffRounds",
							"ownerMood",
							"aiTrades",
							"disableInjuries",
							"gamesInProgress",
							"autoPlaySeasons",
							"teamAbbrevsCache",
							"teamNamesCache",
							"teamRegionsCache",
							"teamImgURLsCache",
							"stopGames",
							"lastDbChange",
							"statusText",
							"phaseText",
							"phaseChangeInProgress",
							"showFirstOwnerMessage",
							"draftLottery",
							"offensiveReboundingFactor",
						].map(key => ({
							type: "object",
							properties: {
								key: {
									const: key,
								},
							},
							required: ["key"],
						})),
					],
				},
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
							ref: "#/definitions/playerContract",
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
										ref: "#/definitions/playerSkill",
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
							type: "boolean",
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
							ref: "#/definitions/playerInjury",
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
							type: ["integer", "null"],
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
								properties: {},
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
							type: "boolean",
						},
						weight: {
							type: ["number", "null"],
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
							minimum: 0,
						},
						series: {
							type: "array",
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										home: {
											ref: "#/definitions/playoffSeriesTeam",
										},
										away: {
											ref: "#/definitions/playoffSeriesTeam",
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
							ref: "#/definitions/playerContract",
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
						budget: {},
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
									gp: {
										type: "integer",
										minimum: 0,
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
									wonConf: {
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
											type: "integer",
											minimum: -1,
											maximum: 1,
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
										type: "object",
										properties: {
											luxuryTaxShare: {
												ref: "#/definitions/budgetItem",
											},
											merch: {
												ref: "#/definitions/budgetItem",
											},
											sponsor: {
												ref: "#/definitions/budgetItem",
											},
											ticket: {
												ref: "#/definitions/budgetItem",
											},
											nationalTv: {
												ref: "#/definitions/budgetItem",
											},
											localTv: {
												ref: "#/definitions/budgetItem",
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
									expenses: {
										type: "object",
										properties: {
											salary: {
												ref: "#/definitions/budgetItem",
											},
											luxuryTax: {
												ref: "#/definitions/budgetItem",
											},
											minTax: {
												ref: "#/definitions/budgetItem",
											},
											scouting: {
												ref: "#/definitions/budgetItem",
											},
											coaching: {
												ref: "#/definitions/budgetItem",
											},
											health: {
												ref: "#/definitions/budgetItem",
											},
											facilities: {
												ref: "#/definitions/budgetItem",
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
										type: "integer",
										minimum: 0,
									},
								},
								required: [
									"season",
									"gp",
									"gpHome",
									"att",
									"cash",
									"won",
									"lost",
									"wonHome",
									"lostHome",
									"wonAway",
									"lostAway",
									"wonDiv",
									"lostDiv",
									"wonConf",
									"lostConf",
									"lastTen",
									"streak",
									"playoffRoundsWon",
									"hype",
									"pop",
									"revenues",
									"expenses",
									"payrollEndOfSeason",
								],
							},
						},
						stats: {
							type: "array",
							items: {
								type: "object",
								properties: {},
							},
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
									ref: "#/definitions/tradeTeam",
								},
								{
									ref: "#/definitions/tradeTeam",
								},
							],
						},
					},
					required: ["rid", "teams"],
				},
				maxItems: 1,
			},
		},
	};
};

module.exports = generateJSONSchema;
