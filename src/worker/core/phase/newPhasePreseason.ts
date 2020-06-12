import { PLAYER, applyRealTeamInfo } from "../../../common";
import { finances, freeAgents, league, player, team } from "..";
import { idb } from "../../db";
import { env, g, helpers, local, logEvent, random, toUI } from "../../util";
import type {
	Conditions,
	PhaseReturn,
	RealTeamInfo,
} from "../../../common/types";

const newPhasePreseason = async (
	conditions: Conditions,
): Promise<PhaseReturn> => {
	const repeatSeason = g.get("repeatSeason");
	if (!repeatSeason) {
		await freeAgents.autoSign();
	}
	await league.setGameAttributes({
		season: g.get("season") + 1,
	});
	await toUI("updateLocal", [
		{
			games: [],
		},
	]);

	const teams = await idb.cache.teams.getAll();
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season") - 1], [g.get("season")]],
	);

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	let updatedTeams = false;
	let scoutingRank: number | undefined;
	for (const t of teams) {
		// Check if we need to override team info based on a season-specific entry in realTeamInfo
		if (realTeamInfo && t.srID && realTeamInfo[t.srID]) {
			const old = {
				region: t.region,
				name: t.name,
				imgURL: t.imgURL,
			};

			const updated = applyRealTeamInfo(t, realTeamInfo, g.get("season"), {
				exactSeason: true,
			});

			if (updated) {
				updatedTeams = true;
				await idb.cache.teams.put(t);

				if (t.region !== old.region) {
					const text = `the ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						t.abbrev,
						g.get("season"),
					])}">${t.region} ${t.name}</a>.`;

					logEvent({
						text: helpers.upperCaseFirstLetter(text),
						type: "teamRelocation",
						tids: [t.tid],
						showNotification: false,
						score: 20,
					});
				} else if (t.name !== old.name) {
					const text = `the ${old.region} ${
						old.name
					} are now the <a href="${helpers.leagueUrl([
						"roster",
						t.abbrev,
						g.get("season"),
					])}">${t.region} ${t.name}</a>.`;

					logEvent({
						text: helpers.upperCaseFirstLetter(text),
						type: "teamRename",
						tids: [t.tid],
						showNotification: false,
						score: 20,
					});
				} else if (t.imgURL && t.imgURL !== old.imgURL) {
					logEvent({
						text: `The <a href="${helpers.leagueUrl([
							"roster",
							t.abbrev,
							g.get("season"),
						])}">${t.region} ${t.name}</a> got a new logo:<br><img src="${
							t.imgURL
						}" class="mt-2" style="max-width:120px;max-height:120px;">`,
						type: "teamLogo",
						tids: [t.tid],
						showNotification: false,
						score: 20,
					});
				}
			}
		}

		if (t.disabled) {
			continue;
		}

		const tid = t.tid;
		// Only actually need 3 seasons for userTid, but get it for all just in case there is a
		// skipped season (alternatively could use cursor to just find most recent season, but this
		// is not performance critical code)
		const teamSeasons2 = await idb.getCopies.teamSeasons({
			tid,
			seasons: [g.get("season") - 3, g.get("season") - 1],
		});
		const prevSeason = teamSeasons2[teamSeasons2.length - 1];

		// Only need scoutingRank for the user's team to calculate fuzz when ratings are updated below.
		// This is done BEFORE a new season row is added.
		if (tid === g.get("userTid")) {
			scoutingRank = finances.getRankLastThree(
				teamSeasons2,
				"expenses",
				"scouting",
			);
		}

		const newSeason = team.genSeasonRow(t, prevSeason);

		if (t.pop === undefined) {
			t.pop = newSeason.pop;
		}
		if (t.stadiumCapacity === undefined) {
			t.stadiumCapacity = newSeason.stadiumCapacity;
		}

		// Mean population should stay constant, otherwise the economics change too much
		t.pop *= random.uniform(0.98, 1.02);
		newSeason.pop = t.pop;

		await idb.cache.teams.put(t);
		await idb.cache.teamSeasons.add(newSeason);
		await idb.cache.teamStats.add(team.genStatsRow(tid));
	}

	if (updatedTeams) {
		await league.setGameAttributes({
			teamInfoCache: teams.map(t => ({
				abbrev: t.abbrev,
				disabled: t.disabled,
				imgURL: t.imgURL,
				name: t.name,
				region: t.region,
			})),
		});
	}

	if (scoutingRank === undefined) {
		throw new Error("scoutingRank should be defined");
	}

	const coachingRanks: Record<number, number> = {};
	for (const teamSeason of teamSeasons) {
		coachingRanks[teamSeason.tid] = finances.getRankLastThree(
			[teamSeason],
			"expenses",
			"coaching",
		);
	}
	const players = await idb.cache.players.indexGetAll("playersByTid", [
		PLAYER.FREE_AGENT,
		Infinity,
	]);

	// Small chance that a player was lying about his age!
	if (!repeatSeason && Math.random() < 0.01) {
		const p = player.getPlayerFakeAge(players);

		if (p) {
			const years = random.randInt(1, 4);
			const age0 = g.get("season") - p.born.year;
			p.born.year -= years;
			const age1 = g.get("season") - p.born.year;
			const name = `<a href="${helpers.leagueUrl(["player", p.pid])}">${
				p.firstName
			} ${p.lastName}</a>`;
			const reason = random.choice([
				`A newly discovered Kenyan birth certificate suggests that ${name}`,
				`In a televised press conference, the parents of ${name} explained how they faked his age as a child to make him perform better against younger competition. He`,
				`Internet sleuths on /r/nba uncovered evidence that ${name}`,
				`Internet sleuths on Twitter uncovered evidence that ${name}`,
				`In an emotional interview on 60 Minutes, ${name} admitted that he`,
				`During a preaseason locker room interview, ${name} accidentally revealed that he`,
				`In a Reddit AMA, ${name} confirmed that he`,
				`A recent Wikileaks report revealed that ${name}`,
				`A foreign ID from the stolen luggage of ${name} revealed he`,
			]);
			logEvent(
				{
					type: "ageFraud",
					text: `${reason} is actually ${age1} years old, not ${age0} as was previously thought.`,
					showNotification: p.tid === g.get("userTid"),
					pids: [p.pid],
					tids: [p.tid],
					persistent: true,
					score: 20,
				},
				conditions,
			);
			await idb.cache.players.put(p);
		}
	}

	// Loop through all non-retired players
	for (const p of players) {
		if (!repeatSeason) {
			// Update ratings
			player.addRatingsRow(p, scoutingRank);
			player.develop(p, 1, false, coachingRanks[p.tid]);

			// Update player values after ratings changes
			player.updateValues(p);

			// If player is a free agent, re-assess contract demands
			if (p.tid === PLAYER.FREE_AGENT) {
				const newContract = player.genContract(p);

				if (newContract.amount > p.contract.amount) {
					// If player is still good, bump up contract demands
					newContract.amount = (newContract.amount + p.contract.amount) / 2;
					newContract.amount = 50 * Math.round(newContract.amount / 50); // Make it a multiple of 50k
				}

				player.setContract(p, newContract, false);
			}
		} else {
			const info = repeatSeason.players[p.pid];
			if (info) {
				p.tid = info.tid;
				p.injury = helpers.deepCopy(info.injury);
				p.contract = helpers.deepCopy(info.contract);
				p.contract.exp += 1;
				p.salaries.push({
					season: p.contract.exp,
					amount: p.contract.amount,
				});
			} else {
				p.tid = PLAYER.FREE_AGENT;
			}

			// First entry for last season, so it skips injuries
			const newRatings = helpers.deepCopy(
				p.ratings.find(pr => pr.season === g.get("season") - 1),
			);
			if (newRatings) {
				newRatings.season += 1;
				p.ratings.push(newRatings);
			}
			p.transactions = [];
		}

		// Add row to player stats if they are on a team
		if (p.tid >= 0) {
			player.addStatsRow(p, false);
		}

		await idb.cache.players.put(p);
	}

	if (local.autoPlaySeasons > 0) {
		local.autoPlaySeasons -= 1;
	}

	// No ads during multi season auto sim
	if (env.enableLogging && local.autoPlaySeasons === 0) {
		toUI("showModal", [], conditions);
	}

	return {
		updateEvents: ["playerMovement"],
	};
};

export default newPhasePreseason;
