import { PLAYER, RATINGS, bySport } from "../../common";
import { idb } from "../db";
import type { UpdateEvents, ViewInput } from "../../common/types";
import {
	finalizePlayersRelativesList,
	formatPlayerRelativesList,
} from "./customizePlayer";
import { choice, shuffle } from "../../common/random";
import { g } from "../util";
import { maxBy } from "../../common/utils";

const newPlayers = (
	inputPlayers: ViewInput<"comparePlayers">["players"],
	statePlayers:
		| {
				season: number;
				p: {
					pid: number;
				};
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

		if (inputP.pid !== stateP.p.pid || inputP.season !== stateP.season) {
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
				} else if (pos === "LB") {
					ratings.push("pcv", "tck", "prs", "rns");
				} else if (pos === "CB") {
					ratings.push("pcv", "tck", "prs", "rns");
				} else if (pos === "S") {
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

const updateComparePlayers = async (
	inputs: ViewInput<"comparePlayers">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		inputs.playoffs !== state.playoffs ||
		newPlayers(inputs.players, state.players)
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

				const season = choice(p.ratings).season;

				playersToShow.push({
					pid: p.pid,
					season,
				});
				found = true;
				break;
			}

			if (!found) {
				break;
			}
		}

		const stats = bySport({
			baseball: [],
			basketball: [
				"gp",
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
			],
			football: [],
			hockey: [],
		});

		const players = [];
		for (const { pid, season } of playersToShow) {
			const pRaw = await idb.getCopy.players({ pid }, "noCopyCache");
			if (pRaw) {
				const p = await idb.getCopy.playersPlus(pRaw, {
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"age",
						"watch",
						"face",
						"imgURL",
						"awards",
						"draft",
						"tid",
						"experience",
						"awards",
					],
					ratings: ["pos", "ovr", "pot", ...RATINGS],
					stats,
					playoffs: inputs.playoffs === "playoffs",
					regularSeason: inputs.playoffs === "regularSeason",
					combined: inputs.playoffs === "combined",
					season: season === "career" ? undefined : season,
					showNoStats: true,
					showRookies: true,
					fuzz: true,
					mergeStats: "totOnly",
				});

				if (season === "career") {
					const statsKey =
						inputs.playoffs === "playoffs"
							? "careerStatsPlayoffs"
							: inputs.playoffs === "combined"
								? "careerStatsCombined"
								: "careerStats";
					p.stats = p[statsKey];
					delete p[statsKey];

					// Peak ratings
					p.ratings = maxBy(p.ratings, "ovr");
				} else {
					p.awards = (p.awards as any[]).filter(
						award => award.season === season,
					);
				}

				players.push({
					p,
					season,
					firstSeason: pRaw.ratings[0].season as number,
					lastSeason: pRaw.ratings.at(-1)!.season as number,
				});
			}
		}

		// Only show ratings relevant to these players' positions
		const ratings = getRatingsByPositions(players.map(p => p.p.ratings.pos));

		const initialAvailablePlayers = finalizePlayersRelativesList(
			currentPlayers.map(formatPlayerRelativesList),
		);

		return {
			initialAvailablePlayers,
			playoffs: inputs.playoffs,
			players,
			ratings,
			stats,
		};
	}
};

export default updateComparePlayers;
