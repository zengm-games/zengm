import assert from "assert";
import testHelpers from "../../../test/helpers";
import team from "./index";
import player from "../player/index";
import valueChange from "./valueChange";

/*
const generate = (
	tid: number,
	age: number,
	draftYear: number,
	newLeague: boolean,
	scoutingRank: number,
)
*/

/* valueChange function declaration

const valueChange = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
	estValuesCached?: TradePickValues,
)

*/

/* genContract function declaration

genContract = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutPid<MinimalPlayerRatings>,
	randomizeExp: boolean = false,
	randomizeAmount: boolean = true,
	noLimit: boolean = false,
)

*/

/* team infos from getTeamDefault()

    {
				tid: 0,
				cid: 0,
				did: 2,
				imgURL: undefined,
				...teamInfos.ATL,
            },
            

        teamInfos.ATL ==
        ATL: {
			region: "Atlanta",
			name: "Gold Club",
			abbrev: "ATL",
			pop: 4.3,
			colors: ["#5c4a99", "#f0e81c", "#211e1e"],
        }
        
*/

/* draft pick type

dp = {
    tid:
    orignialTid:
    round:
    pick:
    season:
    dpid:
}

*/

describe("worker/core/team/valueChange", () => {
	beforeAll(async () => {
		testHelpers.resetG();
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
			[{ min: 1000, gp: 37, per: 16 }],
			[
				{ min: 1250, gp: 37, per: 11 },
				{ min: 2600, gp: 82, per: 7 },
			],
			[{ min: 1250, gp: 37, per: 8 }],
			[
				{ min: 1250, gp: 37, per: 6 },
				{ min: 2600, gp: 82, per: 7 },
				{ min: 2600, gp: 82, per: 5 },
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

			genPlayers = genPlayers.concat([p1, p2, p3]);
		}

		await testHelpers.resetCache({
			players: genPlayers,
			teams: genTeams,
		});
	});

	test("initial checks", async () => {
		//same trade twice for different teams
		const trade1 = await valueChange(1, [0], [25], [], []); //good player for bad player
		// (0 <--> 9)
		const trade1Backwards = await valueChange(0, [25], [0], [], []); //bad player for good player
		// (9 <--> 0)
		const trade2 = await valueChange(1, [0], [16], [], []); //same player for same player
		// (0 <--> 0)
		const trade2Backwards = await valueChange(0, [16], [0], [], []); //same player for same player
		// (0 <--> 0)

		assert.equal(trade1 > 0, true);
		assert.equal(trade1Backwards > 0, false);

		assert.equal(Math.abs(trade2 - trade2Backwards) < 10, true); //fudge factor changes the p.values so it won't be perfect
	});

	test("trade a couple players", async () => {
		const trade1 = await valueChange(1, [2], [20, 31], [], []); //a great player <--> a good player + project/pick
		// (2 <--> 4,15)
		const trade2 = await valueChange(1, [4, 13], [21, 27], [], []); //the better player + the worse project <--> the worse player + the better project
		// (4,13 <--> 5,11)

		assert.equal(trade1 > 0, true);
		assert.equal(trade2 > 0, true);
	});

	test("change team ambitions", async () => {
		const trade1 = await valueChange(2, [12], [38], [], []); //good project <--> good player
		// (12 <--> 6)
		const trade2 = await valueChange(2, [9], [44], [], []); //old player <--> good project
		// (9 <--> 12)

		assert.equal(trade1 > 0, true);
		assert.equal(trade2 > 0, false);
	});

	//trade picks
	//I stopped writing tests here because I spent a couple hours unsuccessfully generating picks
	//I started building and running to test pick for pick trades as well as complex trades that would
	//have been tested below.

	//It's also easier to console.log a whole bunch and mess around in the shared worker

	//trade players and picks
});
