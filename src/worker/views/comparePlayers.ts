import { PLAYER, RATINGS, bySport } from "../../common";
import { idb } from "../db";
import type { UpdateEvents, ViewInput } from "../../common/types";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "./customizePlayer";
import { shuffle } from "../../common/random";
import { g, getTeamInfoBySeason } from "../util";
import { maxBy } from "../../common/utils";
import { getPlayerProfileStats } from "./player";
import type { SeasonType } from "../api/processInputs";

const hasPlayerInfoChanged = (
	inputPlayers: ViewInput<"comparePlayers">["players"],
	statePlayers:
		| {
				season: number;
				p: {
					pid: number;
				};
				playoffs: SeasonType;
		  }[]
		| undefined,
) => {
	// This just happens on initial render, which should never trigger because it checks firstRun before this, but let's just be careful
	if (statePlayers === undefined) {
		return true;
	}

	// This happens when the URL is just /l/0/compare_players and it picks two random players, we don't want to refresh and pick new random players
	if (inputPlayers.length === 0) {
		return false;
	}

	if (inputPlayers.length !== statePlayers.length) {
		return true;
	}

	for (let i = 0; i < inputPlayers.length; i++) {
		const inputP = inputPlayers[i];
		const stateP = statePlayers[i];

		if (
			inputP.pid !== stateP.p.pid ||
			inputP.season !== stateP.season ||
			inputP.playoffs !== stateP.playoffs
		) {
			return true;
		}
	}

	return false;
};

const getRatingsByPositions = (positions: string[]) => {
	const sportSpecific = bySport({
		baseball: () => {
			const ratings = ["hgt", "spd"];
			for (const pos of positions) {
				if (pos === "SP" || pos === "RP") {
					ratings.push("ppw", "ctl", "mov", "endu");
				} else {
					ratings.push("hpw", "con", "eye", "gnd", "fly", "thr", "cat");
				}
			}
			return new Set(ratings);
		},
		basketball: () => {
			return new Set(RATINGS);
		},
		football: () => {
			const ratings = ["hgt", "stre", "spd", "endu"];
			for (const pos of positions) {
				if (pos === "QB") {
					ratings.push("thv", "thp", "tha", "bsc");
				} else if (pos === "RB" || pos === "WR") {
					ratings.push("bsc", "elu", "rtr", "hnd");
				} else if (pos === "TE") {
					ratings.push("bsc", "elu", "rtr", "hnd", "rbk", "pbk");
				} else if (pos === "OL") {
					ratings.push("rbk", "pbk");
				} else if (pos === "DL") {
					ratings.push("tck", "prs", "rns");
				} else if (pos === "LB" || pos === "CB" || pos === "S") {
					ratings.push("pcv", "tck", "prs", "rns");
				} else if (pos === "K") {
					ratings.push("kpw", "kac");
				} else if (pos === "P") {
					ratings.push("ppw", "pac");
				}
			}
			return new Set(ratings);
		},
		hockey: () => {
			const ratings = [];
			for (const pos of positions) {
				if (pos === "G") {
					ratings.push("glk");
				} else {
					ratings.push(
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
					);
				}
			}
			return new Set(ratings);
		},
	})();

	return ["ovr", "pot", ...RATINGS.filter(rating => sportSpecific.has(rating))];
};

const getStatsByPositions = (positions: string[]) => {
	const sportSpecific = bySport<() => Set<string> | string[]>({
		baseball: () => {
			const stats = [];
			for (const pos of positions) {
				if (pos === "SP" || pos === "RP") {
					stats.push(
						"gpPit",
						"gsPit",
						"ip",
						"w",
						"l",
						"sv",
						"era",
						"soPit",
						"bbPit",
						"whip",
					);
				} else {
					stats.push(
						"gp",
						"pa",
						"h",
						"hr",
						"rbi",
						"sb",
						"ba",
						"obp",
						"slg",
						"ops",
					);
				}
			}
			return new Set([...stats, "war"]);
		},
		basketball: () => {
			return [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"stl",
				"blk",
				"tov",
				"fgp",
				"ftp",
				"tpp",
				"tsp",
				"tpar",
				"ftr",
				"per",
				"bpm",
				"vorp",
			];
		},
		football: () => {
			const stats = ["gp"];
			for (const pos of positions) {
				if (pos === "QB") {
					stats.push(
						"qbRec",
						"pssCmp",
						"pss",
						"cmpPct",
						"pssYds",
						"pssTD",
						"pssInt",
						"qbRat",
						"rus",
						"rusYds",
						"rusYdsPerAtt",
						"rusTD",
						"fmbLost",
					);
				} else if (pos === "RB" || pos === "WR" || pos === "TE") {
					stats.push(
						"rus",
						"rusYds",
						"rusYdsPerAtt",
						"rusTD",
						"fmbLost",
						"tgt",
						"rec",
						"recYds",
						"recYdsPerRec",
						"recTD",
					);
				} else if (pos === "OL") {
					continue;
				} else if (
					pos === "DL" ||
					pos === "LB" ||
					pos === "CB" ||
					pos === "S"
				) {
					stats.push(
						"defTck",
						"defTckLoss",
						"defSk",
						"defSft",
						"defPssDef",
						"defInt",
						"defIntTD",
						"defFmbFrc",
						"defFmbRec",
						"defFmbTD",
					);
				} else if (pos === "K") {
					stats.push(
						"fg",
						"fga",
						"fgPct",
						"fgLng",
						"xp",
						"xpa",
						"xpPct",
						"kickingPts",
					);
				} else if (pos === "P") {
					stats.push(
						"pnt",
						"pntYdsPerAtt",
						"pntIn20",
						"pntTB",
						"pntLng",
						"pntBlk",
					);
				}
			}
			return new Set([...stats, "fp", "av"]);
		},
		hockey: () => {
			const stats = [];
			for (const pos of positions) {
				if (pos === "G") {
					stats.push(
						"gpGoalie",
						"gRec",
						"ga",
						"sa",
						"sv",
						"svPct",
						"gaa",
						"so",
					);
				} else {
					stats.push(
						"gpSkater",
						"g",
						"a",
						"pts",
						"pm",
						"pim",
						"ppG",
						"shG",
						"gwG",
						"s",
						"ops",
						"dps",
					);
				}
			}
			return new Set([...stats, "ps"]);
		},
	})();

	return Array.from(sportSpecific);
};

const updateComparePlayers = async (
	inputs: ViewInput<"comparePlayers">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		hasPlayerInfoChanged(inputs.players, state.players)
	) {
		const currentPlayers = (await idb.cache.players.getAll()).filter(p => {
			// Don't include far future players
			if (p.tid === PLAYER.UNDRAFTED && p.draft.year > g.get("season") + 2) {
				return false;
			}

			return true;
		});

		const playersToShow = [...inputs.players];

		// If fewer than 2 players, pick some random ones
		while (playersToShow.length < 2) {
			let found = false;

			const pidsToShow = new Set(playersToShow.map(p => p.pid));

			shuffle(currentPlayers);
			for (const p of currentPlayers) {
				if (pidsToShow.has(p.pid)) {
					continue;
				}
				if (p.tid === PLAYER.UNDRAFTED) {
					continue;
				}

				// Current season, if possible
				const season =
					p.ratings.findLast(row => row.season === g.get("season"))?.season ??
					p.ratings.at(-1)!.season;

				playersToShow.push({
					pid: p.pid,
					season,
					playoffs: "regularSeason",
				});
				found = true;
				break;
			}

			if (!found) {
				break;
			}
		}

		const allStats = getPlayerProfileStats();

		const players = [];
		for (const { pid, season, playoffs } of playersToShow) {
			const pRaw = await idb.getCopy.players({ pid }, "noCopyCache");
			if (pRaw) {
				const p = await idb.getCopy.playersPlus(pRaw, {
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"born",
						"watch",
						"face",
						"imgURL",
						"awards",
						"draft",
						"tid",
						"experience",
						"awards",
					],
					ratings: ["season", "pos", "ovr", "pot", ...RATINGS],
					stats: allStats,
					playoffs: playoffs === "playoffs",
					regularSeason: playoffs === "regularSeason",
					combined: playoffs === "combined",
					season: season === "career" ? undefined : season,
					showNoStats: true,
					showRookies: true,
					fuzz: true,
					mergeStats: "totOnly",
				});

				if (p) {
					let teamInfo;
					if (season === "career") {
						const statsKey =
							playoffs === "playoffs"
								? "careerStatsPlayoffs"
								: playoffs === "combined"
									? "careerStatsCombined"
									: "careerStats";
						p.stats = p[statsKey];
						delete p[statsKey];

						// Peak ratings
						p.ratings = maxBy(p.ratings, "ovr");

						teamInfo = await getTeamInfoBySeason(p.tid, p.ratings.season);
					} else {
						p.awards = (p.awards as any[]).filter(
							award => award.season === season,
						);
						teamInfo = await getTeamInfoBySeason(p.tid, season);
					}

					if (teamInfo) {
						p.colors = teamInfo.colors;
						p.jersey = teamInfo.jersey;
					}

					players.push({
						p,
						season,
						firstSeason: pRaw.ratings[0].season as number,
						lastSeason: pRaw.ratings.at(-1)!.season as number,
						playoffs,
					});
				}
			}
		}

		// In summary table show ratings/stats relevant to these players' positions
		const positions = players.map(p => p.p.ratings.pos);
		const ratings = getRatingsByPositions(positions);
		const stats = getStatsByPositions(positions);

		const initialAvailablePlayers = finalizePlayersRelativesList(
			currentPlayers.map(formatPlayerRelativesList),
		);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			initialAvailablePlayers,
			players,
			ratings,
			stats,
		};
	}
};

export default updateComparePlayers;
