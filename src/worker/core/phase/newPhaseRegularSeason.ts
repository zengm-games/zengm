import { season } from "..";
import { idb } from "../../db";
import { g, helpers, local, logEvent, toUI } from "../../util";
import type { Conditions, PhaseReturn } from "../../../common/types";
import {
	EMAIL_ADDRESS,
	FACEBOOK_USERNAME,
	GAME_NAME,
	isSport,
	SUBREDDIT_NAME,
	TWITTER_HANDLE,
} from "../../../common";

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

	if (g.get("autoDeleteOldBoxScores")) {
		const tx = idb.league.transaction("games", "readwrite");
		const gameStore = tx.store;

		// openKeyCursor is crucial for performance in Firefox
		let cursor = await gameStore.openKeyCursor(
			IDBKeyRange.upperBound(g.get("season") - 3),
		);

		while (cursor) {
			gameStore.delete(cursor.primaryKey);
			cursor = await cursor.continue();
		}

		await tx.done;
	}

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
					text: `<b>Mailing List</b><br>If you'd like to receive a quarterly email containing the latest news about ${GAME_NAME}, <a href="https://landing.mailerlite.com/webforms/landing/z7d2z9" target="_blank" rel="noopener noreferrer">subscribe to our newsletter here</a>.`,
					type: "info",
				});
			} else {
				const nagged = await idb.meta.get("attributes", "nagged");

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
						text: `<p>Hi. Sorry to bother you, but I noticed that you've been playing this game a bit. Hopefully that means you like it. Either way, I would really appreciate some feedback to help me make it better. <a href="mailto:${EMAIL_ADDRESS}">Send an email</a> (${EMAIL_ADDRESS}) or join the discussion on <a href="http://www.reddit.com/r/${SUBREDDIT_NAME}/">Reddit</a> or <a href="https://discord.gg/caPFuM9">Discord</a>.</p>`,
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
							text: `<p>Hi. Sorry to bother you again, but if you like the game, please share it with your friends! Also:</p><p><a href="https://twitter.com/${TWITTER_HANDLE}">Follow ${GAME_NAME} on Twitter</a></p><p><a href="https://www.facebook.com/${FACEBOOK_USERNAME}">Like ${GAME_NAME} on Facebook</a></p><p><a href="http://www.reddit.com/r/${SUBREDDIT_NAME}/">Discuss ${GAME_NAME} on Reddit</a></p><p><a href="https://discord.gg/caPFuM9">Chat with ${GAME_NAME} players and devs on Discord</a></p><p>The more people that play ${GAME_NAME}, the more motivation I have to continue improving it. So it is in your best interest to help me promote the game! If you have any other ideas, please <a href="mailto:${EMAIL_ADDRESS}">email me</a>.</p>`,
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

	let url;
	if (g.get("season") > g.get("startingSeason")) {
		url = helpers.leagueUrl(["season_preview"]);
	}

	return {
		url,
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseRegularSeason;
