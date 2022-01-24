import { isSport, PLAYER } from "../../../common";
import { finances, player, realRosters } from "..";
import genPlayersWithoutSaving from "./genPlayersWithoutSaving";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";

/**
 * Generate a set of draft prospects.
 *
 * This is called after draft classes are moved up a year, to create the new draft class. It's also called 3 times when a new league starts, to create 3 future draft classes.
 *
 * @memberOf core.draft
 * @param {number} draftYear Year for the draft class.
 * @param {?number=} scoutingRank Between 1 and g.get("numActiveTeams"), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree. If null, then it's automatically found.
 * @param {?number=} numPlayers The number of prospects to generate. Default value is 70.
 * @return {Promise}
 */
const genPlayers = async (
	draftYear: number,
	scoutingRank: number | undefined | null = null,
	forceScrubs?: boolean,
) => {
	// If scoutingRank is not supplied, have to hit the DB to get it
	if (scoutingRank === undefined || scoutingRank === null) {
		const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
			"teamSeasonsByTidSeason",
			[
				[g.get("userTid"), g.get("season") - 2],
				[g.get("userTid"), g.get("season")],
			],
		);
		scoutingRank = finances.getRankLastThree(
			teamSeasons,
			"expenses",
			"scouting",
		);
	}

	const allDraftProspects = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.UNDRAFTED,
	);

	const existingPlayers = allDraftProspects.filter(
		p => p.draft.year === draftYear,
	);

	// Trigger randomDebutsForever?
	if (g.get("randomDebutsForever") !== undefined) {
		// Trigger condition - draftYear has no real players in it, or the year after draftYear has no real players in it
		const currentRealPlayers = existingPlayers.filter(p => p.real).length;
		const nextRealPlayers = allDraftProspects.filter(
			p => p.real && p.draft.year === draftYear + 1,
		).length;
		if (currentRealPlayers === 0 || nextRealPlayers === 0) {
			await realRosters.updateRandomDebutsForever(
				draftYear,
				currentRealPlayers,
			);
			return;
		}
	}

	const players = await genPlayersWithoutSaving(
		draftYear,
		scoutingRank,
		existingPlayers,
		forceScrubs,
	);

	for (const p of players) {
		await idb.cache.players.add(p);

		// idb.cache.players.add will create the "pid" property, transforming PlayerWithoutKey to Player
		// @ts-expect-error
		await player.addRelatives(p);

		await player.updateValues(p);
	}

	// Easter eggs!
	if (isSport("basketball") && !forceScrubs) {
		if (Math.random() < 1 / 100000) {
			const p = player.generate(
				PLAYER.UNDRAFTED,
				19,
				draftYear,
				false,
				scoutingRank,
			);
			p.born.year = draftYear - 48;
			p.born.loc = "Los Angeles, CA";
			p.college = "Washington State University";
			p.firstName = "LaVar";
			p.hgt = 78;
			p.imgURL = "/img/lavar.jpg";
			p.lastName = "Ball";
			p.weight = 250;
			Object.assign(p.ratings[0], {
				hgt: 43,
				stre: 80,
				spd: 80,
				jmp: 80,
				endu: 80,
				ins: 80,
				dnk: 80,
				ft: 80,
				fg: 80,
				tp: 80,
				oiq: 80,
				diq: 80,
				drb: 80,
				pss: 80,
				reb: 80,
			});
			await player.develop(p, 0);
			await player.updateValues(p);
			const pid = await idb.cache.players.add(p);

			if (typeof pid === "number") {
				await logEvent({
					type: "playerFeat",
					text: `<a href="${helpers.leagueUrl(["player", pid])}">${
						p.firstName
					} ${
						p.lastName
					}</a> got sick of the haters and decided to show the world how a big baller plays.`,
					showNotification: false,
					pids: [pid],
					tids: [g.get("userTid")],
				});
			}
			// eslint-disable-next-line no-dupe-else-if
		} else if (Math.random() < 1 / 100000) {
			const p = player.generate(
				PLAYER.UNDRAFTED,
				19,
				draftYear,
				false,
				scoutingRank,
			);
			p.born.year = draftYear - 47;
			p.born.loc = "Honolulu, HI";
			p.college = "Columbia University";
			p.firstName = "Barack";
			p.hgt = 73;
			p.imgURL = "/img/obama.jpg";
			p.lastName = "Obama";
			p.weight = 175;
			Object.assign(p.ratings[0], {
				hgt: 20,
				stre: 80,
				spd: 80,
				jmp: 80,
				endu: 80,
				ins: 90,
				dnk: 80,
				ft: 80,
				fg: 80,
				tp: 40,
				oiq: 80,
				diq: 80,
				drb: 90,
				pss: 80,
				reb: 100,
			});
			await player.develop(p, 0);
			await player.updateValues(p);
			p.ratings[0].skills = ["Dp"];
			const pid = await idb.cache.players.add(p);

			if (typeof pid === "number") {
				await logEvent({
					type: "playerFeat",
					text: `<a href="${helpers.leagueUrl(["player", pid])}">${
						p.firstName
					} ${
						p.lastName
					}</a> decided to bring hope and change to Basketball GM.`,
					showNotification: false,
					pids: [pid],
					tids: [g.get("userTid")],
				});
			}
			// eslint-disable-next-line no-dupe-else-if
		} else if (Math.random() < 1 / 100000) {
			const p = player.generate(
				PLAYER.UNDRAFTED,
				19,
				draftYear,
				false,
				scoutingRank,
			);
			p.born.year = draftYear - 70;
			p.born.loc = "Queens, NY";
			p.college = "Wharton";
			p.firstName = "Donald";
			p.hgt = 75;
			p.imgURL = "/img/trump.jpg";
			p.lastName = "Trump";
			p.weight = 240;
			Object.assign(p.ratings[0], {
				hgt: 40,
				stre: 80,
				spd: 80,
				jmp: 80,
				endu: 80,
				ins: 80,
				dnk: 80,
				ft: 80,
				fg: 80,
				tp: 80,
				oiq: 80,
				diq: 100,
				drb: 80,
				pss: 0,
				reb: 80,
			});
			await player.develop(p, 0);
			await player.updateValues(p);
			p.ratings[0].skills = ["Dp"];
			const pid = await idb.cache.players.add(p);

			if (typeof pid === "number") {
				await logEvent({
					type: "playerFeat",
					text: `<a href="${helpers.leagueUrl(["player", pid])}">${
						p.firstName
					} ${p.lastName}</a> decided to Make Basketball GM Great Again.`,
					showNotification: false,
					pids: [pid],
					tids: [g.get("userTid")],
				});
			}
		}
	}
};

export default genPlayers;
