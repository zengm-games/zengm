import getTeamInfos from "../../../common/getTeamInfos";
import { idb } from "../../db";
import { g, updatePlayMenu, random, toUI } from "../../util";
import league from "../league";

const relocateVote = async ({
	override,
	realign,
	rebrandTeam,
	userVote,
}: {
	override: boolean;
	realign: boolean;
	rebrandTeam: boolean;
	userVote: boolean;
}) => {
	const autoRelocate = g.get("autoRelocate");
	if (!autoRelocate) {
		throw new Error("Should never happen");
	}

	const t = await idb.cache.teams.get(autoRelocate.tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	const numActiveTeams = g.get("numActiveTeams");

	const result = {
		for: 0,
		against: 0,
	};

	const runVote = () => {
		result.for = random.randInt(0, numActiveTeams - 1);
		if (userVote) {
			result.for += 1;
		}
		result.against = numActiveTeams - result.for;
	};

	runVote();

	// If vote disagreed with user, try again! Just for fun.
	if (result.for > result.against !== userVote) {
		runVote();
	}

	if (override) {
		while (result.for > result.against !== userVote) {
			runVote();
		}
	}

	if (result.for > result.against) {
		const newTeam = getTeamInfos([
			{
				tid: t.tid,
				cid: -1,
				did: -1,
				abbrev: autoRelocate.abbrev,
			},
		])[0];

		t.abbrev = newTeam.abbrev;
		t.region = newTeam.region;
		t.pop = newTeam.pop;

		if (rebrandTeam) {
			t.jersey = newTeam.jersey;
			t.name = newTeam.name;
			t.imgURL = newTeam.imgURL;
			t.imgURLSmall = newTeam.imgURLSmall;
			t.colors = newTeam.colors;
		}

		await idb.cache.teams.put(t);

		const realigned = autoRelocate.realigned;
		if (realign && realigned) {
			const divs = g.get("divs");
			for (const div of divs) {
				const tids = realigned[div.did];
				for (const tid of tids) {
					const t = await idb.cache.teams.get(tid);
					if (t) {
						t.cid = div.cid;
						t.did = div.did;
						await idb.cache.teams.put(t);
					}
				}
			}
		}
	}

	await league.setGameAttributes({
		autoRelocate: undefined,
	});

	await updatePlayMenu();

	await toUI("realtimeUpdate", [["team"]]);

	return result;
};

export default relocateVote;
