import { g } from "../../util";
import testHelpers from "../../../test/helpers";
import { player, trade } from "..";

const beforeTests = async () => {
	testHelpers.resetG();

	g.setWithoutSavingToDB("numTeams", 3);
	g.setWithoutSavingToDB("numActiveTeams", 3);

	await testHelpers.resetCache({
		players: [
			// Two players per team
			player.generate(0, 30, 2017, true, 15.5),
			player.generate(0, 30, 2017, true, 15.5),
			player.generate(1, 30, 2017, true, 15.5),
			player.generate(1, 30, 2017, true, 15.5),
			player.generate(2, 30, 2017, true, 15.5),
			player.generate(2, 30, 2017, true, 15.5),
		],

		trade: [
			{
				rid: 0,
				teams: [
					{
						tid: 0,
						pids: [],
						pidsExcluded: [],
						dpids: [],
						dpidsExcluded: [],
					},
					{
						tid: 1,
						pids: [],
						pidsExcluded: [],
						dpids: [],
						dpidsExcluded: [],
					},
				],
			},
		],
	});
};

const reset = async () => {
	// Set to a trade with team 1 and no players;
	await trade.create([
		{
			tid: g.get("userTid"),
			pids: [],
			dpids: [],
			pidsExcluded: [],
			dpidsExcluded: [],
		},
		{ tid: 1, pids: [], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
	]);
	await trade.clear();
};

export {
	// eslint-disable-next-line import/prefer-default-export
	beforeTests,
	reset,
};
