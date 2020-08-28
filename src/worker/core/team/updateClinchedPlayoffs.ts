import { idb } from "../../db";
import type { TeamSeason, Conditions } from "../../../common/types";
import { g, helpers, logEvent } from "../../util";
import { season } from "..";

type ClinchedPlayoffs = TeamSeason["clinchedPlayoffs"];

const getClinchedPlayoffs = (
	teamSeasons: TeamSeason[],
	finalStandings: boolean,
): ClinchedPlayoffs[] => {
	return teamSeasons.map(t => {
		const worstCases = teamSeasons.map(t2 => {
			// Handle tied undefined
			const tied = t2.tied === undefined ? 0 : t2.tied;

			const gp = t2.won + t2.lost + tied;

			// finalStandings means the season is over, which matters because in some league structures not all teams will play the same number of games
			const gamesLeft = finalStandings ? 0 : g.get("numGames") - gp;

			const worstCase = {
				tid: t2.tid,
				seasonAttrs: {
					won: t2.won,
					lost: t2.lost,
					tied,
					winp: 0,
					cid: t2.cid,
					did: t2.did,
				},
			};

			if (gamesLeft > 0) {
				if (t2.tid === t.tid) {
					// 0.1 extra is to simulate team losing all tie breakers
					worstCase.seasonAttrs.lost += gamesLeft + 0.1;
				} else {
					worstCase.seasonAttrs.won += gamesLeft;
				}
			}
			worstCase.seasonAttrs.winp = helpers.calcWinp(worstCase.seasonAttrs);

			return worstCase;
		});

		const sorted = helpers.orderByWinp(worstCases);

		// x - clinched playoffs
		// y - if byes exist - clinched bye
		// z - clinched home court advantage
		// o - eliminated
		let clinchedPlayoffs: ClinchedPlayoffs;

		if (sorted[0].tid === t.tid) {
			clinchedPlayoffs = "z";
		} else {
			const result = season.genPlayoffSeries(sorted);
			const matchups = result.series[0];
			for (const matchup of matchups) {
				if (!matchup.away && matchup.home.tid === t.tid) {
					clinchedPlayoffs = "y";
					break;
				}
			}

			if (!clinchedPlayoffs) {
				if (result.tidPlayoffs.includes(t.tid)) {
					clinchedPlayoffs = "x";
				}
			}
		}

		if (!clinchedPlayoffs) {
			const bestCases = teamSeasons.map(t2 => {
				// Handle tied undefined
				const tied = t2.tied === undefined ? 0 : t2.tied;

				const gp = t2.won + t2.lost + tied;

				// finalStandings means the season is over, which matters because in some league structures not all teams will play the same number of games
				const gamesLeft = finalStandings ? 0 : g.get("numGames") - gp;

				const bestCase = {
					tid: t2.tid,
					seasonAttrs: {
						won: t2.won,
						lost: t2.lost,
						tied,
						winp: 0,
						cid: t2.cid,
						did: t2.did,
					},
				};

				if (gamesLeft > 0) {
					if (t2.tid === t.tid) {
						// 0.1 extra is to simulate team winning all tie breakers
						bestCase.seasonAttrs.won += gamesLeft + 0.1;
					} else {
						bestCase.seasonAttrs.lost += gamesLeft;
					}
				}
				bestCase.seasonAttrs.winp = helpers.calcWinp(bestCase.seasonAttrs);

				return bestCase;
			});

			const sorted = helpers.orderByWinp(bestCases);

			const result = season.genPlayoffSeries(sorted);
			if (!result.tidPlayoffs.includes(t.tid)) {
				clinchedPlayoffs = "o";
			}
		}

		return clinchedPlayoffs;
	});
};

const updateClinchedPlayoffs = async (
	finalStandings: boolean,
	conditions: Conditions,
) => {
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);

	const clinchedPlayoffs = getClinchedPlayoffs(teamSeasons, finalStandings);

	for (let i = 0; i < teamSeasons.length; i++) {
		const ts = teamSeasons[i];
		if (clinchedPlayoffs[i] !== ts.clinchedPlayoffs) {
			ts.clinchedPlayoffs = clinchedPlayoffs[i];

			let action = "";
			if (clinchedPlayoffs[i] === "x") {
				action = "clinched a playoffs spot";
			} else if (clinchedPlayoffs[i] === "y") {
				action = "clinched a first round bye";
			} else if (clinchedPlayoffs[i] === "z") {
				action = `clinched the #1 overall seed and home ${
					process.env.SPORT === "basketball" ? "court" : "field"
				} advantage`;
			} else if (clinchedPlayoffs[i] === "o") {
				action = "have been eliminated from playoff contention";
			}

			logEvent(
				{
					type: "playoffs",
					text: `The <a href="${helpers.leagueUrl([
						"roster",
						`${ts.abbrev}_${ts.tid}`,
						g.get("season"),
					])}">${ts.name}</a> ${action}.`,
					showNotification: ts.tid === g.get("userTid"),
					tids: [ts.tid],
					score: 10,
				},
				conditions,
			);

			await idb.cache.teamSeasons.put(ts);
		}
	}
};

export default updateClinchedPlayoffs;
