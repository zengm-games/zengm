import getTeamInfos from "../../../common/getTeamInfos";
import { idb } from "../../db";
import { g, updatePlayMenu, random, toUI, logEvent, helpers } from "../../util";
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

	const newTeam = getTeamInfos([
		{
			tid: t.tid,
			cid: -1,
			did: -1,
			abbrev: autoRelocate.abbrev,
		},
	])[0];

	let eventText;

	if (result.for > result.against) {
		eventText = `The ${t.region} ${
			t.name
		} are now the <a href="${helpers.leagueUrl([
			"roster",
			t.abbrev,
			g.get("season"),
		])}">${newTeam.region} ${newTeam.name}</a> after a successful ${
			result.for
		}-${result.against} vote.`;

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
			for (let i = 0; i < divs.length; i++) {
				const div = divs[i];
				const tids = realigned[i];
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

		const teams = await idb.cache.teams.getAll();
		await league.setGameAttributes({
			teamInfoCache: teams.map(t => ({
				abbrev: t.abbrev,
				disabled: t.disabled,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				name: t.name,
				region: t.region,
			})),
		});
	} else {
		eventText = `The <a href="${helpers.leagueUrl([
			"roster",
			t.abbrev,
			g.get("season"),
		])}">${t.region} ${t.name}</a> wanted to move to ${
			newTeam.region
		}, but they lost the vote ${result.against}-${result.for}.`;
	}

	await league.setGameAttributes({
		autoRelocate: undefined,
	});

	await updatePlayMenu();

	await toUI("realtimeUpdate", [["team"]]);

	logEvent({
		text: eventText,
		type: "teamRelocation",
		tids: [t.tid],
		showNotification: false,
		score: 20,
	});

	return result;
};

export default relocateVote;
