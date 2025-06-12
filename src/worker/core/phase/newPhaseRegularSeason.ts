import { season } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local, logEvent, toUI } from "../../util/index.ts";
import type { Conditions, Game, PhaseReturn } from "../../../common/types.ts";
import {
	EMAIL_ADDRESS,
	FACEBOOK_USERNAME,
	GAME_NAME,
	isSport,
	SUBREDDIT_NAME,
	TWITTER_HANDLE,
} from "../../../common/index.ts";

class GameHasYourTeamCache {
	cache: Record<number, boolean> = {};
	userTidCache: Record<number, number> = {};

	getUserTid(season: number) {
		let userTid = this.userTidCache[season];
		if (userTid === undefined) {
			userTid = g.get("userTid", season);
			this.userTidCache[season] = userTid;
		}

		return userTid;
	}

	check(game: Game) {
		const cached = this.cache[game.gid];
		if (cached !== undefined) {
			return cached;
		}

		const userTid = this.getUserTid(game.season);

		const value =
			game.teams[0].tid === userTid || game.teams[1].tid === userTid;
		this.cache[game.gid] = value;

		return value;
	}
}

const deleteOldBoxScores = async () => {
	const saveOldBoxScores = g.get("saveOldBoxScores");
	if (
		saveOldBoxScores.pastSeasons === "all" &&
		saveOldBoxScores.pastSeasonsType === "all"
	) {
		// Not deleting anything
	} else {
		// Extra flush before reading games from IndexedDB, in case there is a game in memory with an added/deleted note
		await idb.cache.flush(["games"]);

		// readwrite index is slow here in Firefox unless we iterate using openKeyCursor, but that means it's difficult to apply complex logic to deciding when to delete a game. So iterate with full objects in a readonly cursor, and save the deleting for later (happens at the end of phase change, so very soon) because just deleting a bunch of games by their primary key is fast (well, kind of... if you have like 100k games or something it's fairly slow, but that shouldn't happen unless the user does something weird).
		const gameIndex = idb.league.transaction("games").store.index("season");

		let range;
		if (
			saveOldBoxScores.pastSeasonsType === "all" &&
			saveOldBoxScores.pastSeasons !== "all" &&
			saveOldBoxScores.pastSeasons > 0
		) {
			// If we're saving all box scores in the past N seasons, we can use an IDBKeyRange to avoid event looking at those box scores
			range = IDBKeyRange.upperBound(
				g.get("season") - saveOldBoxScores.pastSeasons,
				true,
			);
		}

		// For performance, not sure how much it actually matters
		const gameHasYourTeamCache = new GameHasYourTeamCache();

		const saveIfMeetsConditions = (
			type: Exclude<keyof typeof saveOldBoxScores, "pastSeasons">,
			game: Game,
		) => {
			return (
				saveOldBoxScores[type] === "all" ||
				(saveOldBoxScores[type] === "your" && gameHasYourTeamCache.check(game))
			);
		};

		for await (const { value: game } of gameIndex.iterate(range)) {
			if (saveIfMeetsConditions("pastSeasonsType", game)) {
				if (
					saveOldBoxScores.pastSeasons === "all" ||
					game.season >= g.get("season") - saveOldBoxScores.pastSeasons
				) {
					continue;
				}
			}
			if (saveIfMeetsConditions("note", game)) {
				if (game.noteBool) {
					continue;
				}
			}
			if (saveIfMeetsConditions("playoffs", game)) {
				if (game.playoffs) {
					continue;
				}
			}
			if (saveIfMeetsConditions("finals", game)) {
				if (game.finals) {
					continue;
				}
			}
			if (saveIfMeetsConditions("playerFeat", game)) {
				const userTid = gameHasYourTeamCache.getUserTid(game.season);
				if (
					game.teams.some(
						(t) =>
							t.playerFeat &&
							(saveOldBoxScores.playerFeat === "all" || t.tid === userTid),
					)
				) {
					continue;
				}
			}
			if (saveIfMeetsConditions("clutchPlays", game)) {
				if (game.clutchPlays && game.clutchPlays.length > 0) {
					continue;
				}
			}
			if (saveIfMeetsConditions("allStar", game)) {
				const isAllStarGame =
					game.teams[0].tid === -1 && game.teams[1].tid === -2;
				if (isAllStarGame) {
					continue;
				}
			}

			// If we made it this far, game is not to be saved
			await idb.cache.games.delete(game.gid);
		}
	}
};

const newPhaseRegularSeason = async (
	conditions: Conditions,
): Promise<PhaseReturn> => {
	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: ["cid", "did"],
			season: g.get("season"),
			active: true,
		},
		"noCopyCache",
	);

	await season.setSchedule(season.newSchedule(teams));

	await deleteOldBoxScores();

	// Without this, then there is a race condition creating it on demand in addGame, and some of the first day's games are lost
	await idb.cache.headToHeads.put({
		season: g.get("season"),
		regularSeason: {},
		playoffs: {},
	});

	if (!local.autoPlayUntil) {
		if (g.get("season") > g.get("startingSeason") && Math.random() < 0.1) {
			await toUI("requestPersistentStorage", [], conditions);
		} else {
			let naggedMailingList = await idb.meta.get(
				"attributes",
				"naggedMailingList",
			);
			if (typeof naggedMailingList !== "number") {
				naggedMailingList = 0;
			}
			if (
				!local.mailingList &&
				g.get("season") === g.get("startingSeason") + 3 &&
				g.get("lid") > 3 &&
				(naggedMailingList === 0 ||
					(naggedMailingList === 1 && Math.random() < 0.01))
			) {
				await idb.meta.put(
					"attributes",
					naggedMailingList + 1,
					"naggedMailingList",
				);
				logEvent({
					extraClass: "",
					persistent: true,
					saveToDb: false,
					text: `<b>Mailing List</b><br>If you'd like to receive a quarterly email containing the latest news about ${GAME_NAME}, <a href="https://landing.mailerlite.com/webforms/landing/z7d2z9" target="_blank">subscribe to our newsletter here</a>.`,
					type: "info",
				});
			} else {
				const nagged = (await idb.meta.get("attributes", "nagged")) as number;

				if (
					g.get("season") === g.get("startingSeason") + 3 &&
					g.get("lid") > 3 &&
					(nagged === 0 || nagged === undefined)
				) {
					await idb.meta.put("attributes", 1, "nagged");
					await idb.cache.messages.add({
						read: false,
						from: "The Commissioner",
						year: g.get("season"),
						text: `<p>Hi. Sorry to bother you, but I noticed that you've been playing this game a bit. Hopefully that means you like it. Either way, I would really appreciate some feedback to help me make it better. <a href="mailto:${EMAIL_ADDRESS}">Send an email</a> (${EMAIL_ADDRESS}) or join the discussion on <a href="http://www.reddit.com/r/${SUBREDDIT_NAME}/">Reddit</a> or <a href="https://zengm.com/discord/">Discord</a>.</p>`,
					});
				} else if (nagged !== undefined) {
					if (
						(nagged === 1 && Math.random() < 0.125) ||
						(nagged >= 2 && Math.random() < 0.0125)
					) {
						await idb.meta.put("attributes", 2, "nagged");
						await idb.cache.messages.add({
							read: false,
							from: "The Commissioner",
							year: g.get("season"),
							text: `<p>Hi. Sorry to bother you again, but if you like the game, please share it with your friends! Also:</p><p><a href="https://twitter.com/${TWITTER_HANDLE}">Follow ${GAME_NAME} on Twitter</a></p><p><a href="https://www.facebook.com/${FACEBOOK_USERNAME}">Like ${GAME_NAME} on Facebook</a></p><p><a href="http://www.reddit.com/r/${SUBREDDIT_NAME}/">Discuss ${GAME_NAME} on Reddit</a></p><p><a href="https://zengm.com/discord/">Chat with ${GAME_NAME} players and devs on Discord</a></p><p>The more people that play ${GAME_NAME}, the more motivation I have to continue improving it. So it is in your best interest to help me promote the game! If you have any other ideas, please <a href="mailto:${EMAIL_ADDRESS}">email me</a>.</p>`,
						});
					} else if (
						isSport("basketball") &&
						nagged >= 2 &&
						nagged <= 3 &&
						Math.random() < 0.5
					) {
						// Skipping 3, obsolete
						await idb.meta.put("attributes", 4, "nagged");
						await idb.cache.messages.add({
							read: false,
							from: "The Commissioner",
							year: g.get("season"),
							text: '<p>Want to try multiplayer Basketball GM? Some intrepid souls have banded together to form online multiplayer leagues, and <a href="https://www.reddit.com/r/BasketballGM/wiki/basketball_gm_multiplayer_league_list">you can find a user-made list of them here</a>.</p>',
						});
					}
				}
			}
		}
	}

	let redirect;
	if (g.get("season") > g.get("startingSeason")) {
		redirect = {
			url: helpers.leagueUrl(["season_preview"]),
			text: "View season preview",
		};
	}

	return {
		redirect,
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseRegularSeason;
