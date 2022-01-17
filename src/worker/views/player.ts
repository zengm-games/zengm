import {
	PLAYER,
	PLAYER_STATS_TABLES,
	RATINGS,
	PLAYER_SUMMARY,
	isSport,
	DEFAULT_JERSEY,
} from "../../common";
import { player } from "../core";
import { idb } from "../db";
import {
	face,
	formatEventText,
	g,
	getTeamColors,
	getTeamInfoBySeason,
	helpers,
	processPlayersHallOfFame,
	random,
} from "../util";
import type {
	MenuItemHeader,
	MenuItemLink,
	MinimalPlayerRatings,
	Player,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import orderBy from "lodash-es/orderBy";
import findLast from "lodash-es/findLast";

const fixRatingsStatsAbbrevs = async (p: {
	ratings?: {
		abbrev: string;
		season: number;
		tid?: number;
	}[];
	stats?: {
		abbrev: string;
		season: number;
		tid?: number;
	}[];
}) => {
	const keys = ["ratings", "stats"] as const;

	for (const key of keys) {
		const rows = p[key];
		if (rows) {
			for (const row of rows) {
				if (row.tid !== undefined) {
					const info = await getTeamInfoBySeason(row.tid, row.season);
					if (info) {
						row.abbrev = info.abbrev;
					}
				}
			}
		}
	}
};

export const getCommon = async (pid?: number, season?: number) => {
	if (pid === undefined) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			type: "error" as const,
			errorMessage: "Player not found.",
		};
		return returnValue;
	}

	const statSummary = Object.values(PLAYER_SUMMARY);

	const statTables = Object.values(PLAYER_STATS_TABLES);
	let stats = Array.from(
		new Set(
			statTables.reduce<string[]>((allStats, currentStats) => {
				return allStats.concat(currentStats.stats);
			}, []),
		),
	);

	// Needed because shot locations tables are "special" for now, unfortunately
	if (isSport("basketball")) {
		stats = stats.concat([
			"fgAtRim",
			"fgaAtRim",
			"fgpAtRim",
			"fgLowPost",
			"fgaLowPost",
			"fgpLowPost",
			"fgMidRange",
			"fgaMidRange",
			"fgpMidRange",
			"tp",
			"tpa",
			"tpp",
		]);
	}

	const pRaw = await idb.getCopy.players(
		{
			pid,
		},
		"noCopyCache",
	);

	if (!pRaw) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			type: "error" as const,
			errorMessage: "Player not found.",
		};
		return returnValue;
	}

	await face.upgrade(pRaw);

	type Stats = {
		season: number;
		tid: number;
		abbrev: string;
		age: number;
		playoffs: boolean;
		jerseyNumber: string;
	} & Record<string, number>;

	const p:
		| (Pick<
				Player,
				| "pid"
				| "tid"
				| "hgt"
				| "weight"
				| "born"
				| "contract"
				| "diedYear"
				| "face"
				| "imgURL"
				| "injury"
				| "injuries"
				| "college"
				| "relatives"
				| "awards"
		  > & {
				age: number;
				ageAtDeath: number | null;
				draft: Player["draft"] & {
					age: number;
					abbrev: string;
					originalAbbrev: string;
				};
				name: string;
				abbrev: string;
				mood: any;
				salaries: any[];
				salariesTotal: any;
				untradable: any;
				untradableMsg?: string;
				ratings: (MinimalPlayerRatings & {
					abbrev: string;
					age: number;
					tid: number;
				})[];
				stats: Stats[];
				careerStats: Stats;
				careerStatsPlayoffs: Stats;
				jerseyNumber?: string;
				experience: number;
				note?: string;
				watch: boolean;
		  })
		| undefined = await idb.getCopy.playersPlus(pRaw, {
		attrs: [
			"pid",
			"name",
			"tid",
			"abbrev",
			"age",
			"ageAtDeath",
			"hgt",
			"weight",
			"born",
			"diedYear",
			"contract",
			"draft",
			"face",
			"mood",
			"injury",
			"injuries",
			"salaries",
			"salariesTotal",
			"awards",
			"imgURL",
			"watch",
			"college",
			"relatives",
			"untradable",
			"jerseyNumber",
			"experience",
			"note",
		],
		ratings: [
			"season",
			"abbrev",
			"tid",
			"age",
			"ovr",
			"pot",
			...RATINGS,
			"skills",
			"pos",
			"injuryIndex",
		],
		stats: ["season", "tid", "abbrev", "age", "jerseyNumber", ...stats],
		playoffs: true,
		showRookies: true,
		fuzz: true,
	});

	if (!p) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			type: "error" as const,
			errorMessage: "Player not found.",
		};
		return returnValue;
	}

	await fixRatingsStatsAbbrevs(p);

	// Filter out rows with no games played
	p.stats = p.stats.filter(row => row.gp > 0);

	const userTid = g.get("userTid");

	if (p.tid !== PLAYER.RETIRED) {
		p.mood = await player.moodInfos(pRaw);

		// Account for extra free agent demands
		if (p.tid === PLAYER.FREE_AGENT) {
			p.contract.amount = p.mood.user.contractAmount / 1000;
		}
	}

	const willingToSign = !!(p.mood && p.mood.user && p.mood.user.willing);

	const retired = p.tid === PLAYER.RETIRED;

	let teamName = "";
	if (p.tid >= 0) {
		teamName = `${g.get("teamInfoCache")[p.tid]?.region} ${
			g.get("teamInfoCache")[p.tid]?.name
		}`;
	} else if (p.tid === PLAYER.FREE_AGENT) {
		teamName = "Free Agent";
	} else if (
		p.tid === PLAYER.UNDRAFTED ||
		p.tid === PLAYER.UNDRAFTED_FANTASY_TEMP
	) {
		teamName = "Draft Prospect";
	} else if (p.tid === PLAYER.RETIRED) {
		teamName = "Retired";
	}

	const teams = await idb.cache.teams.getAll();

	const jerseyNumberInfos: {
		number: string;
		start: number;
		end: number;
		t?: {
			tid: number;
			colors: [string, string, string];
			jersey?: string;
			name: string;
			region: string;
		};
		retired: boolean;
	}[] = [];
	let prevKey: string = "";
	for (const ps of p.stats) {
		const jerseyNumber = ps.jerseyNumber;
		if (jerseyNumber === undefined || ps.gp === 0) {
			continue;
		}

		const ts = await getTeamInfoBySeason(ps.tid, ps.season);
		let t;
		if (ts && ts.colors && ts.name !== undefined && ts.region !== undefined) {
			t = {
				tid: ps.tid,
				colors: ts.colors,
				jersey: ts.jersey,
				name: ts.name,
				region: ts.region,
			};
		}

		// Don't include jersey in key, because it's not visible in the jersey number display
		const key = JSON.stringify([
			jerseyNumber,
			t?.tid,
			t?.colors,
			t?.name,
			t?.region,
		]);

		if (key === prevKey) {
			const prev = jerseyNumberInfos.at(-1);
			prev.end = ps.season;
		} else {
			let retired = false;
			const t2 = teams[ps.tid];
			if (t2 && t2.retiredJerseyNumbers) {
				retired = t2.retiredJerseyNumbers.some(
					info => info.pid === pid && info.number === jerseyNumber,
				);
			}

			jerseyNumberInfos.push({
				number: jerseyNumber,
				start: ps.season,
				end: ps.season,
				t,
				retired,
			});
		}

		prevKey = key;
	}

	let teamColors;
	let teamJersey;
	if (p.tid === PLAYER.RETIRED) {
		const { legacyTid } = processPlayersHallOfFame([p])[0];

		// Randomly pick a season that he played on this team, and use that for colors
		const teamJerseyNumberInfos = jerseyNumberInfos.filter(
			info => info.t && info.t.tid === legacyTid,
		);
		if (teamJerseyNumberInfos.length > 0) {
			const info = random.choice(teamJerseyNumberInfos);
			if (info.t) {
				teamColors = info.t.colors;
				teamJersey = info.t.jersey;
			}
		}
	}
	if (teamColors === undefined) {
		teamColors = await getTeamColors(p.tid);
	}
	if (teamJersey === undefined) {
		teamJersey = (await idb.cache.teams.get(p.tid))?.jersey ?? DEFAULT_JERSEY;
	}

	// Quick links to other players...
	let customMenu: MenuItemHeader | undefined;
	let customMenuInfo:
		| {
				title: string;
				players: Player[];
		  }
		| undefined;
	if (p.tid >= 0) {
		// ...on same team

		customMenuInfo = {
			title: "Roster",
			players: await idb.cache.players.indexGetAll("playersByTid", p.tid),
		};
	} else if (p.tid === PLAYER.FREE_AGENT) {
		// ...also free agents

		customMenuInfo = {
			title: "Free Agents",
			players: await idb.cache.players.indexGetAll("playersByTid", p.tid),
		};
	} else if (p.tid === PLAYER.UNDRAFTED) {
		// ...in same draft class

		customMenuInfo = {
			title: "Draft Class",
			players: (
				await idb.cache.players.indexGetAll("playersByTid", p.tid)
			).filter(p2 => p2.draft.year === p.draft.year),
		};
	}

	if (customMenuInfo) {
		const children: MenuItemLink[] = orderBy(
			customMenuInfo.players,
			"value",
			"desc",
		).map(p2 => {
			const ratings = p2.ratings.at(-1);

			const age = g.get("season") - p2.born.year;

			let description = `${age}yo`;

			if (!g.get("challengeNoRatings")) {
				const ovr = player.fuzzRating(ratings.ovr, ratings.fuzz);
				const pot = player.fuzzRating(ratings.pot, ratings.fuzz);

				description += `, ${ovr}/${pot}`;
			}

			return {
				type: "link",
				league: true,
				path: ["player", p2.pid],
				text: `${ratings.pos} ${p2.firstName} ${p2.lastName} (${description})`,
			};
		});

		customMenu = {
			type: "header",
			long: customMenuInfo.title,
			short: customMenuInfo.title,
			league: true,
			children,
		};
	}

	let teamURL;
	if (p.tid >= 0) {
		teamURL = helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`]);
	} else if (p.tid === PLAYER.FREE_AGENT) {
		teamURL = helpers.leagueUrl(["free_agents"]);
	} else if (
		p.tid === PLAYER.UNDRAFTED ||
		p.tid === PLAYER.UNDRAFTED_FANTASY_TEMP
	) {
		teamURL = helpers.leagueUrl(["draft_scouting"]);
	}

	if (season !== undefined) {
		// Age/experience
		if (p.stats.length > 0) {
			const offset = season - g.get("season");
			p.age = Math.max(0, p.age + offset);
			const offset2 = season - p.stats.at(-1).season;
			p.experience = Math.max(0, p.experience + offset2);

			// Jersey number
			const stats = findLast(
				p.stats,
				row => row.season === season && !row.playoffs,
			);
			if (stats) {
				if (stats.jerseyNumber !== undefined) {
					p.jerseyNumber = stats.jerseyNumber;
				}

				const info = await getTeamInfoBySeason(stats.tid, stats.season);
				if (info) {
					teamName = `${info.region} ${info.name}`;
					teamColors = info.colors;
					teamJersey = info.jersey;
				}

				teamURL = helpers.leagueUrl([
					"roster",
					`${stats.abbrev}_${stats.tid}`,
					season,
				]);
			}
		}
	}

	return {
		type: "normal" as const,
		currentSeason: g.get("season"),
		customMenu,
		freeAgent: p.tid === PLAYER.FREE_AGENT,
		godMode: g.get("godMode"),
		injured: p.injury.gamesRemaining > 0,
		jerseyNumberInfos,
		phase: g.get("phase"),
		pid, // Needed for state.pid check
		player: p,
		retired,
		showContract:
			p.tid !== PLAYER.UNDRAFTED &&
			p.tid !== PLAYER.UNDRAFTED_FANTASY_TEMP &&
			p.tid !== PLAYER.RETIRED,
		showRatings: !g.get("challengeNoRatings") || retired,
		showTradeFor: p.tid !== userTid && p.tid >= 0,
		showTradingBlock: p.tid === userTid,
		spectator: g.get("spectator"),
		statSummary,
		statTables,
		teamColors,
		teamJersey,
		teamName,
		teamURL,
		willingToSign,
	};
};

const updatePlayer = async (
	inputs: ViewInput<"player">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		!state.retired ||
		state.pid !== inputs.pid
	) {
		const topStuff = await getCommon(inputs.pid);

		if (topStuff.type === "error") {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: topStuff.errorMessage,
			};
			return returnValue;
		}

		const p = topStuff.player;

		const eventsAll = orderBy(
			[
				...(await idb.getCopies.events(
					{
						pid: topStuff.pid,
					},
					"noCopyCache",
				)),
				...(p.draft.dpid !== undefined
					? await idb.getCopies.events(
							{
								dpid: p.draft.dpid,
							},
							"noCopyCache",
					  )
					: []),
			],
			"eid",
			"asc",
		);
		const feats = eventsAll
			.filter(event => event.type === "playerFeat")
			.map(event => {
				return {
					eid: event.eid,
					season: event.season,
					text: helpers.correctLinkLid(g.get("lid"), event.text as any),
				};
			});
		const eventsFiltered = eventsAll.filter(event => {
			// undefined is a temporary workaround for bug from commit 999b9342d9a3dc0e8f337696e0e6e664e7b496a4
			return !(
				event.type === "award" ||
				event.type === "injured" ||
				event.type === "healed" ||
				event.type === "hallOfFame" ||
				event.type === "playerFeat" ||
				event.type === "tragedy" ||
				event.type === undefined
			);
		});

		const events = [];
		for (const event of eventsFiltered) {
			events.push({
				eid: event.eid,
				text: await formatEventText(event),
				season: event.season,
			});
		}

		return {
			...topStuff,
			events,
			feats,
			ratings: RATINGS,
		};
	}
};

export default updatePlayer;
