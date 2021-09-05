import assert from "assert";
import testHelpers from "../../../test/helpers";
import newScheduleGood from "./newScheduleGood";
import { g, helpers } from "../../util";
import range from "lodash-es/range";

describe("worker/core/season/newScheduleGood", () => {
	let defaultTeams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[];

	beforeAll(() => {
		defaultTeams = helpers.getTeamsDefault().map(t => ({
			// Don't need tid to start at 0, could be disabled teams!
			tid: t.tid + 2,
			seasonAttrs: {
				cid: t.cid,
				did: t.did,
			},
		}));
	});

	describe("old basketball tests", () => {
		beforeAll(() => {
			testHelpers.resetG();
			g.setWithoutSavingToDB("allStarGame", null);
		});

		test("schedule 1230 games (82 each for 30 teams)", () => {
			const { tids, warning } = newScheduleGood(defaultTeams);
			assert.strictEqual(warning, undefined);
			assert.strictEqual(tids.length, 1230);
		});

		test("schedule 41 home games and 41 away games for each team", () => {
			const { tids, warning } = newScheduleGood(defaultTeams);
			assert.strictEqual(warning, undefined);

			const home: Record<number, number> = {}; // Number of home games for each team
			const away: Record<number, number> = {}; // Number of away games for each team
			for (let i = 0; i < tids.length; i++) {
				if (home[tids[i][0]] === undefined) {
					home[tids[i][0]] = 0;
				}
				if (away[tids[i][1]] === undefined) {
					away[tids[i][1]] = 0;
				}
				home[tids[i][0]] += 1;
				away[tids[i][1]] += 1;
			}

			assert.strictEqual(Object.keys(home).length, defaultTeams.length);
			for (const numGames of [...Object.values(home), ...Object.values(away)]) {
				assert.strictEqual(numGames, 41);
			}
		});

		test("schedule each team one home game against every team in the other conference", () => {
			const { tids, warning } = newScheduleGood(defaultTeams);
			assert.strictEqual(warning, undefined);

			// Each element in this object is an object representing the number of home games against each other team (only the ones in the other conference will be populated)
			const home: Record<number, Record<number, number>> = {};

			for (let i = 0; i < tids.length; i++) {
				const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
				const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
				if (!t0 || !t1) {
					console.log(tids[i]);
					throw new Error("Team not found");
				}
				if (t0.seasonAttrs.cid !== t1.seasonAttrs.cid) {
					if (home[tids[i][1]] === undefined) {
						home[tids[i][1]] = {};
					}
					if (home[tids[i][1]][tids[i][0]] === undefined) {
						home[tids[i][1]][tids[i][0]] = 0;
					}
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			assert.strictEqual(Object.keys(home).length, defaultTeams.length);

			for (const { tid } of defaultTeams) {
				assert.strictEqual(Object.values(home[tid]).length, 15);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 1),
					15,
				);
			}
		});

		test("schedule each team two home games against every team in the same division", () => {
			const { tids, warning } = newScheduleGood(defaultTeams);
			assert.strictEqual(warning, undefined);

			// Each element in this object is an object representing the number of home games against each other team (only the ones in the same division will be populated)
			const home: Record<number, Record<number, number>> = {};

			for (let i = 0; i < tids.length; i++) {
				const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
				const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
				if (!t0 || !t1) {
					console.log(tids[i]);
					throw new Error("Team not found");
				}
				if (t0.seasonAttrs.did === t1.seasonAttrs.did) {
					if (home[tids[i][1]] === undefined) {
						home[tids[i][1]] = {};
					}
					if (home[tids[i][1]][tids[i][0]] === undefined) {
						home[tids[i][1]][tids[i][0]] = 0;
					}
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			assert.strictEqual(Object.keys(home).length, defaultTeams.length);

			for (const { tid } of defaultTeams) {
				assert.strictEqual(Object.values(home[tid]).length, 4);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 2),
					4,
				);
			}
		});

		test.skip("schedule each team one or two home games against every team in the same conference but not in the same division (one game: 2/10 teams; two games: 8/10 teams)", () => {
			const { tids, warning } = newScheduleGood(defaultTeams);
			assert.strictEqual(warning, undefined);

			// Each element in this object is an object representing the number of home games against each other team (only the ones in the same conference but different division will be populated)
			const home: Record<number, Record<number, number>> = {};

			for (let i = 0; i < tids.length; i++) {
				const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
				const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
				if (!t0 || !t1) {
					console.log(tids[i]);
					throw new Error("Team not found");
				}
				if (
					t0.seasonAttrs.cid === t1.seasonAttrs.cid &&
					t0.seasonAttrs.did !== t1.seasonAttrs.did
				) {
					if (home[tids[i][1]] === undefined) {
						home[tids[i][1]] = {};
					}
					if (home[tids[i][1]][tids[i][0]] === undefined) {
						home[tids[i][1]][tids[i][0]] = 0;
					}
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			assert.strictEqual(Object.keys(home).length, defaultTeams.length);

			for (const { tid } of defaultTeams) {
				console.log(tid, Object.values(home[tid]));
				assert.strictEqual(Object.values(home[tid]).length, 10);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 1),
					2,
				);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 2),
					8,
				);
			}
		});
	});

	describe("old newScheduleCrappy tests", () => {
		const makeTeams = (numTeams: number) => {
			return range(numTeams).map(tid => ({
				// Don't need tid to start at 0, could be disabled teams!
				tid: 5 + tid,
				seasonAttrs: {
					did: 0,
					cid: 0,
				},
			}));
		};

		beforeEach(() => {
			testHelpers.resetG();
			g.setWithoutSavingToDB("allStarGame", null);
		});

		test("when numTeams*numGames is even, everyone gets a full schedule", () => {
			for (let numGames = 2; numGames < 50; numGames += 1) {
				for (let numTeams = 2; numTeams < 50; numTeams += 1) {
					if ((numTeams * numGames) % 2 === 1) {
						continue;
					}

					g.setWithoutSavingToDB("numGames", numGames);
					const teams = makeTeams(numTeams);
					const { tids: matchups } = newScheduleGood(teams);

					// Total number of games
					assert.strictEqual(
						matchups.length * 2,
						numGames * numTeams,
						`Total number of games is wrong for ${numTeams} teams and ${numGames} games`,
					);

					// Number of games for each teams
					const tids = matchups.flat();

					for (const t of teams) {
						const count = tids.filter(tid => t.tid === tid).length;
						assert.strictEqual(count, numGames);
					}
				}
			}
		});

		test("when numTeams*numGames is odd, one team is a game short", () => {
			for (let numGames = 2; numGames < 50; numGames += 1) {
				for (let numTeams = 2; numTeams < 50; numTeams += 1) {
					if ((numTeams * numGames) % 2 === 0) {
						continue;
					}

					g.setWithoutSavingToDB("numGames", numGames);
					const teams = makeTeams(numTeams);
					const { tids: matchups } = newScheduleGood(teams); // Total number of games

					assert.strictEqual(
						matchups.length,
						(numGames * numTeams - 1) / 2,
						`Total number of games is wrong for ${numTeams} teams and ${numGames} games`,
					);

					// Number of games for each teams
					const tids = matchups.flat();
					let oneShort = false;

					for (const t of teams) {
						const count = tids.filter(tid => t.tid === tid).length;

						if (count + 1 === numGames) {
							if (oneShort) {
								throw new Error("Two teams are one game short");
							}

							oneShort = true;
						} else {
							assert.strictEqual(count, numGames);
						}
					}

					assert(
						oneShort,
						`Did not find team with one game short for ${numTeams} teams and ${numGames} games`,
					);
				}
			}
		});

		test("when numGames is even and there are enough games, everyone gets even home and away games", () => {
			for (let numGames = 20; numGames < 50; numGames += 1) {
				if (numGames % 2 === 1) {
					continue;
				}
				for (let numTeams = 2; numTeams < 25; numTeams += 1) {
					g.setWithoutSavingToDB("numGames", numGames);
					const teams = makeTeams(numTeams);
					const { tids: matchups } = newScheduleGood(teams); // Total number of games

					assert.strictEqual(
						matchups.length * 2,
						numGames * numTeams,
						"Total number of games is wrong",
					);

					const home: Record<number, number> = {}; // Number of home games for each team
					const away: Record<number, number> = {}; // Number of away games for each team
					for (let i = 0; i < matchups.length; i++) {
						if (home[matchups[i][0]] === undefined) {
							home[matchups[i][0]] = 0;
						}
						if (away[matchups[i][1]] === undefined) {
							away[matchups[i][1]] = 0;
						}

						home[matchups[i][0]] += 1;
						away[matchups[i][1]] += 1;
					}

					for (const t of teams) {
						assert.strictEqual(home[t.tid], numGames / 2);
						assert.strictEqual(away[t.tid], numGames / 2);
					}
				}
			}
		});
	});

	describe("error handling", () => {
		test("warning if cannot make a full schedule due to there not being enough non-conference games", () => {
			testHelpers.resetG();

			g.setWithoutSavingToDB("numGamesDiv", 2);
			g.setWithoutSavingToDB("numGamesConf", 2);
			g.setWithoutSavingToDB(
				"divs",
				g.get("divs").map(div => ({
					...div,
					cid: 0,
				})),
			);
			g.setWithoutSavingToDB(
				"confs",
				g.get("confs").filter(conf => conf.cid === 0),
			);
			const { tids, warning } = newScheduleGood(
				defaultTeams.map(t => ({
					...t,
					seasonAttrs: {
						cid: 0,
						did: t.seasonAttrs.did,
					},
				})),
			);

			assert.strictEqual(tids.length, 1230);
			assert.strictEqual(typeof warning, "string");
		});
	});

	describe("random test cases", () => {
		beforeEach(() => {
			testHelpers.resetG();
		});

		test("4 games, null div, 2 conf", () => {
			// Test many times to make sure it doesn't intermittently skip a game due to faulty numGames*numTeams odd detection
			for (let i = 0; i < 100; i++) {
				const { tids, warning } = newScheduleGood(defaultTeams, {
					divs: g.get("divs"),
					numGames: 4,
					numGamesDiv: null,
					numGamesConf: 2,
				});

				if (tids.length < 60) {
					const counts: Record<number, number> = {};
					for (const matchup of tids) {
						for (const tid of matchup) {
							if (counts[tid] === undefined) {
								counts[tid] = 0;
							}
							counts[tid] += 1;
						}
					}
					for (const [tid, count] of Object.entries(counts)) {
						if (count < 4) {
							console.log("tid", tid, "count", count);
							console.log(defaultTeams.find(t => t.tid === parseInt(tid)));
						}
					}
					console.log("tids.length", tids.length);
				}

				assert.strictEqual(tids.length, 60);
				assert.strictEqual(warning, undefined);
			}
		});

		// There are 15 teams in the conference, so they can't all get exactly one conference game. Needs to handle the 2 teams that have a missed conference game.
		test("4 games, null div, 1 conf", () => {
			const { tids, warning } = newScheduleGood(defaultTeams, {
				divs: g.get("divs"),
				numGames: 4,
				numGamesDiv: null,
				numGamesConf: 1,
			});

			assert.strictEqual(tids.length, 60);
			assert.strictEqual(warning, undefined);
		});

		test("82 games, 65 div, 17 conf", () => {
			const { tids, warning } = newScheduleGood(defaultTeams, {
				divs: g.get("divs"),
				numGames: 82,
				numGamesDiv: 65,
				numGamesConf: 17,
			});

			assert.strictEqual(tids.length, 1230);
			assert.strictEqual(warning, undefined);
		});

		// the conf with the new team thinks "i can get all my non-conf games with even home/away matchups, 0 excess games!". the conf without the new team thinks "i can play each team once, and then need 14 excess matchups (16+14)". but there are no games available for excess matchups, since the other conf has no excess
		test.skip("one expansion team", () => {
			const { tids, warning } = newScheduleGood([
				...defaultTeams,
				{
					tid: defaultTeams.at(-1).tid + 1,
					seasonAttrs: {
						cid: 0,
						did: 0,
					},
				},
			]);
			console.log("warning", warning, tids.length);

			assert.strictEqual(tids.length, 1271);
			assert.strictEqual(warning, undefined);
		});

		test("numGamesDiv null should roll up to conf not other", () => {
			const numGames = 29; // 1 for each other team
			const { tids, warning } = newScheduleGood(defaultTeams, {
				divs: g.get("divs"),
				numGames,
				numGamesDiv: null,
				numGamesConf: 14, // 1 for each other team
			});

			assert.strictEqual(tids.length, (numGames * defaultTeams.length) / 2);
			assert.strictEqual(warning, undefined);

			// Should be one game for each matchup, no dupes
			const seen = new Set();
			for (const matchup of tids) {
				const key = JSON.stringify([...matchup].sort());
				if (seen.has(key)) {
					throw new Error(`Dupe matchup: ${key}`);
				}
				seen.add(key);
			}
		});

		test("tons of games", () => {
			const numGames = 820;
			const { tids, warning } = newScheduleGood(defaultTeams, {
				divs: g.get("divs"),
				numGames,
				numGamesDiv: 160,
				numGamesConf: 360,
			});

			assert.strictEqual(tids.length, (numGames * defaultTeams.length) / 2);
			assert.strictEqual(warning, undefined);
		});

		test("odd numGamesConf*numTeamsConf, so some team needs to play an extra non-conf game", () => {
			const teams = defaultTeams.slice(0, 10).map((t, i) => ({
				...t,
				seasonAttrs: {
					...t.seasonAttrs,
					cid: i < 5 ? 0 : 1,
					did: i < 5 ? 0 : 1,
				},
			}));

			const divs = [
				{
					did: 0,
					cid: 0,
					name: "Div1",
				},
				{
					did: 1,
					cid: 1,
					name: "Div2",
				},
			];

			const { tids, warning } = newScheduleGood(teams, {
				divs,
				numGames: 13,
				numGamesDiv: null,
				numGamesConf: 9,
			});

			assert.strictEqual(tids.length, 65);
			assert.strictEqual(warning, undefined);
		});
	});
});
