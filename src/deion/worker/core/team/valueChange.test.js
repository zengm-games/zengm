import assert from "assert";
import testHelpers from "../../../test/helpers";
import team from "./index";
import player from "../player/index";
import valueChange from "./valueChange";
import { idb } from "../../db";
import { g } from "../../util";
import updateValues from "../player/updateValues";

describe("worker/core/team/valueChange", () => {
	beforeAll(async () => {
		testHelpers.resetG();
		g.numTeams = 3;
		const myTeamInfo = {
			tid: 0,
			cid: 0,
			did: 0,
			imgURL: undefined,
			region: "Purdue",
			name: "Boilermakers",
			abbrev: "PUR",
			pop: 2.3,
			colors: ["#d4af37", "#000000", "#ffffff"],
		};

		const theirTeamInfo = {
			tid: 1,
			cid: 0,
			did: 0,
			imgURL: undefined,
			region: "Indiana",
			name: "Hoosiers",
			abbrev: "IND",
			pop: 1.2,
			colors: ["#ff0000", "#000000", "#ffffff"],
		};

		const thirdTeamInfo = {
			tid: 2,
			cid: 0,
			did: 0,
			imgURL: undefined,
			region: "Ball State",
			name: "Cardinals",
			abbrev: "BST",
			pop: 0.2,
			colors: ["#ff0000", "#000000", "#ffffff"],
		};

		const myTeam = team.generate(myTeamInfo);
		myTeam.strategy = "contending";

		const theirTeam = team.generate(theirTeamInfo);
		theirTeam.strategy = "contending";

		const thirdTeam = team.generate(thirdTeamInfo);
		thirdTeam.strategy = "rebuilding";

		const genTeams = [myTeam, theirTeam, thirdTeam];

		let genPlayers = [];
		//lets put some players on the roster

		/* { "3": 0, A: 0, B: 0, Di: 0, Dp: 0, Po: 0, Ps: 0, R: 0 } */
		const players = [
			{ ovr: 80, pot: 83, age: 26, skills: ["3", "A", "Dp", "Ps"] }, //0 --> high valued, good players
			{ ovr: 71, pot: 71, age: 28, skills: ["A", "Di", "Po", "R"] },
			{ ovr: 74, pot: 72, age: 30, skills: ["B", "Ps", "3"] },
			{ ovr: 67, pot: 73, age: 23, skills: ["A", "B", "Dp", "Di"] },
			{ ovr: 54, pot: 55, age: 28, skills: ["Ps", "3"] }, //4 --> good to great starters
			{ ovr: 52, pot: 52, age: 30, skills: ["Di", "R"] },
			{ ovr: 57, pot: 54, age: 32, skills: ["R", "Po"] },
			{ ovr: 48, pot: 56, age: 25, skills: ["A"] },
			{ ovr: 48, pot: 54, age: 26, skills: ["3"] }, //8 --> good to great bench players
			{ ovr: 46, pot: 46, age: 30, skills: [] },
			{ ovr: 42, pot: 51, age: 25, skills: ["3"] },
			{ ovr: 44, pot: 43, age: 31, skills: [] },
			{ ovr: 50, pot: 67, age: 19, skills: [] }, //12 --> projects
			{ ovr: 40, pot: 58, age: 20, skills: [] },
			{ ovr: 30, pot: 60, age: 19, skills: [] },
			{ ovr: 30, pot: 47, age: 22, skills: [] },
		];
		// i+16 == same player other team

		const playerContracts = [
			{ amount: 30000, exp: 2019 },
			{ amount: 27500, exp: 2019 },
			{ amount: 28500, exp: 2019 },
			{ amount: 21000, exp: 2019 },
			{ amount: 14000, exp: 2019 },
			{ amount: 13500, exp: 2019 },
			{ amount: 9500, exp: 2019 },
			{ amount: 11000, exp: 2019 },
			{ amount: 10000, exp: 2019 },
			{ amount: 9500, exp: 2019 },
			{ amount: 8500, exp: 2019 },
			{ amount: 7500, exp: 2019 },
			{ amount: 6000, exp: 2019 },
			{ amount: 4500, exp: 2019 },
			{ amount: 2250, exp: 2019 },
			{ amount: 1500, exp: 2019 },
		];

		const playerStats = [
			[
				{ min: 1250, gp: 37, per: 24 },
				{ min: 2600, gp: 82, per: 22 },
				{ min: 2600, gp: 82, per: 20 },
			],
			[
				{ min: 1250, gp: 37, per: 21 },
				{ min: 2600, gp: 82, per: 18 },
				{ min: 2600, gp: 82, per: 20 },
			],
			[
				{ min: 1250, gp: 37, per: 22 },
				{ min: 2600, gp: 82, per: 24 },
				{ min: 2600, gp: 82, per: 22 },
			],
			[
				{ min: 1250, gp: 37, per: 21 },
				{ min: 2600, gp: 82, per: 18 },
				{ min: 2600, gp: 82, per: 16 },
			],
			[
				{ min: 1150, gp: 37, per: 16 },
				{ min: 2400, gp: 82, per: 17 },
				{ min: 2400, gp: 82, per: 17 },
			],
			[
				{ min: 1150, gp: 37, per: 17 },
				{ min: 2400, gp: 82, per: 16 },
				{ min: 2400, gp: 82, per: 19 },
			],
			[
				{ min: 1150, gp: 37, per: 14 },
				{ min: 2400, gp: 82, per: 15 },
				{ min: 2400, gp: 82, per: 16 },
			],
			[
				{ min: 1150, gp: 37, per: 16 },
				{ min: 2400, gp: 82, per: 14 },
				{ min: 2400, gp: 82, per: 13 },
			],
			[
				{ min: 950, gp: 37, per: 15 },
				{ min: 2000, gp: 82, per: 16 },
				{ min: 2000, gp: 82, per: 14 },
			],
			[
				{ min: 950, gp: 37, per: 14 },
				{ min: 2000, gp: 82, per: 15 },
				{ min: 2000, gp: 82, per: 13 },
			],
			[
				{ min: 950, gp: 37, per: 11 },
				{ min: 2000, gp: 82, per: 19 },
				{ min: 2000, gp: 82, per: 13 },
			],
			[
				{ min: 950, gp: 37, per: 16 },
				{ min: 2000, gp: 82, per: 13 },
				{ min: 2000, gp: 82, per: 8 },
			],
			[{ min: 200, gp: 17, per: 16 }],
			[
				{ min: 400, gp: 37, per: 11 },
				{ min: 600, gp: 45, per: 7 },
			],
			[{ min: 220, gp: 22, per: 8 }],
			[
				{ min: 110, gp: 16, per: 6 },
				{ min: 540, gp: 50, per: 7 },
				{ min: 250, gp: 25, per: 5 },
			],
		];

		//add players to teams --> identical teams
		for (let i = 0; i < players.length; i++) {
			const p1 = player.generate(
				0, //tid
				players[i].age, //age
				2016 - (players[i].age - 19), //draft year
				false, // new league
				15.5, // scout rank
			);
			p1.pid = i;
			p1.ratings[0].ovr = players[i].ovr;
			p1.ratings[0].pot = players[i].pot;
			p1.stats = p1.stats.concat(playerStats[i]);
			p1.ratings[0].skills = players[i].skills;
			p1.contract = playerContracts[i];
			player.updateValues(p1);

			const p2 = player.generate(
				1,
				players[i].age,
				2016 - (players[i].age - 19),
				false,
				15.5,
			);
			p2.pid = players.length + i;
			p2.ratings[0].ovr = players[i].ovr;
			p2.ratings[0].pot = players[i].pot;
			p2.stats = p2.stats.concat(playerStats[i]);
			p2.ratings[0].skills = players[i].skills;
			p2.contract = p1.contract;
			player.updateValues(p2);

			const p3 = player.generate(
				2,
				players[i].age,
				2016 - (players[i].age - 19),
				false,
				15.5,
			);
			p3.pid = 2 * players.length + i;
			p3.ratings[0].ovr = players[i].ovr;
			p3.ratings[0].pot = players[i].pot;
			p3.stats = p2.stats.concat(playerStats[i]);
			p3.ratings[0].skills = players[i].skills;
			p3.contract = p1.contract;
			player.updateValues(p3);

			genPlayers = genPlayers.concat([p1, p2, p3]);
		}

		//add players for draftPick value projections
		for (let draftYear = 2016; draftYear < 2019; draftYear++) {
			for (let i = 1; i <= 5; i++) {
				const p1 = player.generate(
					-2,
					19 - draftYear + g.season,
					draftYear,
					false,
					i + 0.5,
				);
				p1.ratings[0].ovr = 60 / 1.05 ** i;
				p1.ratings[0].pot = 70 / 1.05 ** i;
				updateValues(p1);
				p1.draft.round = 1;
				p1.draft.pick = i;
				p1.pid = genPlayers.length + 1;

				const p2 = player.generate(
					-2,
					19 - draftYear + g.season,
					draftYear,
					false,
					30.5 + i,
				);
				p2.ratings[0].ovr = 40 / 1.05 ** i;
				p2.ratings[0].pot = 45 / 1.05 ** i;
				updateValues(p2);
				p2.draft.round = 2;
				p2.draft.pick = i;
				p2.pid = genPlayers.length + 2;

				genPlayers = genPlayers.concat([p1, p2]);
			}
		}

		await testHelpers.resetCache({
			players: genPlayers,
			teams: genTeams,
		});

		//add team seasons for draft picks
		const gamesWon = { 0: [30, 50, 50], 1: [25, 45, 45], 2: [10, 25, 25] };
		const gamesLost = { 0: [11, 32, 32], 1: [16, 37, 37], 2: [31, 57, 57] };
		for (const t of genTeams) {
			for (let year = 2014; year <= 2016; year++) {
				await idb.cache.teamSeasons.add({
					tid: t.tid,
					season: year,
					gp: gamesWon[t.tid][2016 - year] + gamesLost[t.tid][2016 - year],
					won: gamesWon[t.tid][2016 - year],
					lost: gamesLost[t.tid][2016 - year],
				});
			}
		}

		//add draft picks
		let dpNum = 0;
		for (let t = 0; t < 3; t++) {
			for (let year = 2016; year < 2019; year++) {
				for (let pickRound = 1; pickRound <= 2; pickRound++) {
					for (let pickNumber = 1; pickNumber <= 3; pickNumber++) {
						await idb.cache.draftPicks.add({
							tid: t,
							originalTid: t,
							round: pickRound,
							pick: pickNumber,
							year,
							dpid: dpNum,
						});
						dpNum++;
					}
				}
			}
		}
		//each team gets 18 picks --> every pick for every year
	});

	test("trade a single player logic tests", async () => {
		//same trade twice for different teams
		const trade1 = await valueChange(1, [0], [25], [], []); //good player for bad player
		// (0 <--> 9)
		const trade2 = await valueChange(1, [0], [16], [], []); //same player for same player
		// (0 <--> 0)
		const trade2Backwards = await valueChange(0, [16], [0], [], []); //same player for same player
		// (0 <--> 0)

		assert.equal(trade1 > 0, true);
		assert.equal(Math.abs(trade2 - trade2Backwards) < 10, true); //fudge factor changes the p.values so it won't be perfect
	});

	test("trade a couple players logical tests", async () => {
		const trade1 = await valueChange(1, [2], [20, 31], [], []); //a great player <--> a good player + project/pick
		// (2 <--> 4,15)
		const trade2 = await valueChange(1, [4, 13], [21, 27], [], []); //the better player + the worse project <--> the worse player + the better project
		// (4,13 <--> 5,11)

		assert.equal(trade1 > 0, true);
		assert.equal(trade2 > 0, true);
	});

	test("check changes in player value for team ambitions", async () => {
		const trade1 = await valueChange(2, [12], [38], [], []); //good project <--> good player
		// (12 <--> 6)
		const trade2 = await valueChange(2, [9], [44], [], []); //old player <--> good project
		// (9 <--> 12)

		assert.equal(trade1 > 0, true);
		assert.equal(trade2 > 0, false);
	});

	test("single pick logical test", async () => {
		//0-54 dpids, 0-17 == team1, 18-35 == team2, 36-53 == team3
		//1st, 2nd, 3rd --> 0,1,2; 6, 7, 8; 12,13,14
		//4th, 5th, 6th --> 3,4,5; 9,10,11; 15,16,17
		//2016(+0),2017(+18),2018(+36)
		const trade1 = await valueChange(1, [], [], [0], [19]);
		//1st ovr <--> 2nd ovr

		assert.equal(trade1 > 0, true);
	});

	test("couple picks logical test", async () => {
		const trade1 = await valueChange(1, [], [], [0, 5], [19, 21]);
		//1st ovr, late 2nd round <--> 2nd ovr, early 2nd round

		assert.equal(trade1 > 0, false); //not expected
		//we may need to steepen curve for valuing draft picks
	});

	test("check changes in pick value for team ambitions", async () => {
		const trade1 = await valueChange(2, [], [], [0], [37]);
		//1st ovr <--> 2nd ovr
		const trade2 = await valueChange(2, [], [], [36], [1]);
		// 2nd ovr <--> 1st ovr
		const trade3 = await valueChange(2, [], [], [0, 5], [37, 39]);
		//1st ovr, late 2nd round <--> 2nd ovr, early 2nd round

		assert.equal(trade1 > 0, true);
		assert.equal(trade2 > 0, true);
		assert.equal(trade3 > 0, false); //okay but not expected, see comments above
	});

	test("testing full trades (real and fictional)", async () => {
		/*
			trade 1: real trade (2019)
				Team1: A rebuilding dallas mavericks
				Team2: A rebuilding new york knicks
				team1 adds: Kristaps Porzingis, Trey Burke, Courtney Lee
				team1 rms: DeAndre Jordan, Wesley Matthews, Dennis Smith Jr, 2021 1st

			trade 2: real trade (2020)
				Team1: A rebuilding Cleveland Caviliers
				Team2: A buying Utah Jazz
				Team1 adds: Dante Exum, 2022 2nd rounder, 2023 2nd rounder
				Team1 rms: Jordan Clarkson

			trade 3: fictional trade
				Team1: buying
				Team2: selling
				Team1 adds: all-star pg, contributing wing
				Team1 rms: old contributing pg, bench forward, potential contributor, 1st rounder

			trade 4: fictional trade
				Team1: buying
				Team2: rebuilding
				Team1 adds: early prime all-star
				Team1 rms: contributing player of same positon, 1st rounder, future 1st, 2 future 2nds

		*/

		const myTeam = idb.cache.teams.get(0);
		const theirTeam = idb.cache.teams.get(1);

		//trade1
		const kp = JSON.parse(JSON.stringify(await idb.cache.players.get(3)));
		kp.ratings[0].skills = ["3", "Di", "Po"];
		kp.pid = 100;
		kp.tid = 0;
		const tb = JSON.parse(JSON.stringify(await idb.cache.players.get(10)));
		tb.ratings[0].ovr = 40;
		tb.ratings[0].pot = 40;
		tb.ratings[0].skills = [];
		tb.age = 26;
		tb.pid = 101;
		tb.tid = 0;
		const cl = JSON.parse(JSON.stringify(await idb.cache.players.get(15)));
		cl.ratings[0].pot = 35;
		cl.ratings[0].ovr = 35;
		cl.age = 34;
		cl.pid = 102;
		cl.tid = 0;
		myTeam.strategy = "rebuilding";

		const dj = JSON.parse(JSON.stringify(await idb.cache.players.get(5)));
		dj.pid = 103;
		dj.tid = 1;
		const wm = JSON.parse(JSON.stringify(await idb.cache.players.get(10)));
		wm.age = 31;
		wm.pid = 104;
		wm.tid = 1;
		const DSJ = JSON.parse(JSON.stringify(await idb.cache.players.get(7)));
		DSJ.age = 21;
		DSJ.pid = 105;
		DSJ.tid = 1;
		const dp1 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(0)));
		dp1.pick = 3;
		dp1.round = 1;
		dp1.tid = 1;
		dp1.originalTid = 1;
		dp1.dpid = 100;
		theirTeam.strategy = "rebuilding";

		await idb.cache.players.add(kp);
		await idb.cache.players.add(tb);
		await idb.cache.players.add(cl);
		await idb.cache.players.add(dj);
		await idb.cache.players.add(wm);
		await idb.cache.players.add(DSJ);
		await idb.cache.draftPicks.add(dp1);

		const trade1 = await valueChange(
			1,
			[100, 101, 102],
			[103, 104, 105],
			[],
			[100],
		);

		//trade 2
		const de = JSON.parse(JSON.stringify(await idb.cache.players.get(10)));
		de.ratings[0].skills = ["Dp", "B"];
		de.age = 24;
		de.tid = 0;
		de.pid = 106;
		myTeam.strategy = "contending";

		const jc = JSON.parse(JSON.stringify(await idb.cache.players.get(10)));
		jc.tid = 1;
		jc.pid = 107;
		jc.ratings[0].skills = jc.ratings[0].skills.concat("B");
		jc.ratings[0].ovr = 45;
		const dp2 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(4)));
		dp2.dpid = 101;
		dp2.tid = 1;
		dp2.originalTid = 1;
		const dp3 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(5)));
		dp3.dpid = 102;
		dp3.tid = 1;
		dp3.originalTid = 1;
		theirTeam.strategy = "rebuilding";

		await idb.cache.players.add(jc);
		await idb.cache.players.add(de);
		await idb.cache.draftPicks.add(dp2);
		await idb.cache.draftPicks.add(dp3);

		const trade2 = await valueChange(1, [106], [107], [], [101, 102]);

		//trade 3
		const pg1 = JSON.parse(JSON.stringify(await idb.cache.players.get(4)));
		pg1.tid = 0;
		pg1.pid = 108;
		pg1.age = 32;
		const fw = JSON.parse(JSON.stringify(await idb.cache.players.get(9)));
		fw.pid = 109;
		const pc1 = JSON.parse(JSON.stringify(await idb.cache.players.get(13)));
		pc1.ratings[0].pot = 52;
		pc1.pid = 110;
		const dp4 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(2)));
		dp4.tid = 0;
		dp4.originalTid = 0;
		dp4.dpid = 103;
		myTeam.strategy = "contending";

		const pg2 = JSON.parse(JSON.stringify(await idb.cache.players.get(3)));
		pg2.tid = 1;
		pg2.pid = 111;
		const cw = JSON.parse(JSON.stringify(await idb.cache.players.get(10)));
		cw.tid = 1;
		cw.pid = 112;
		cw.age = 31;
		cw.ratings[0].pot = 43;
		theirTeam.strategy = "rebuilding";

		await idb.cache.players.add(pg1);
		await idb.cache.players.add(fw);
		await idb.cache.players.add(pc1);
		await idb.cache.players.add(pg2);
		await idb.cache.players.add(cw);
		await idb.cache.draftPicks.add(dp4);

		const trade3 = await valueChange(1, [108, 109, 110], [111, 112], [103], []);

		//trade 4
		const sf1 = JSON.parse(JSON.stringify(await idb.cache.players.get(3)));
		sf1.ratings[0].skills = ["A", "B", "3", "Dp"];
		sf1.pid = 113;
		sf1.tid = 1;

		const sf2 = JSON.parse(JSON.stringify(await idb.cache.players.get(4)));
		sf2.pid = 114;
		sf2.tid = 0;
		const dp5 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(2)));
		dp5.tid = 0;
		dp5.originalTid = 0;
		dp5.dpid = 104;
		const dp6 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(10)));
		dp6.tid = 0;
		dp6.originalTid = 0;
		dp6.dpid = 105;
		const dp7 = JSON.parse(JSON.stringify(await idb.cache.draftPicks.get(16)));
		dp7.tid = 0;
		dp7.originalTid = 0;
		dp7.dpid = 106;

		await idb.cache.players.add(sf1);
		await idb.cache.players.add(sf2);
		await idb.cache.draftPicks.add(dp5);
		await idb.cache.draftPicks.add(dp6);
		await idb.cache.draftPicks.add(dp7);

		const trade4 = await valueChange(1, [114], [113], [104, 105, 106], []);

		console.log(trade1, trade2, trade3, trade4);

		assert.equal(trade1 > 0, true);
		assert.equal(trade2 > 0, false); //this is a corner case that can't be touched... despreate trade
		// we should also think about how to value picks better.
		// I think the curve should be steeper, future 2nds are too valuable
		assert.equal(trade3 > 0, true);
		assert.equal(trade4 > 0, true);
	});
});
