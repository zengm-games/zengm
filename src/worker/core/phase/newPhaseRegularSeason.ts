import { season } from "..";
import { idb, iterate } from "../../db";
import { g, helpers, local, logEvent } from "../../util";
import type { PhaseReturn } from "../../../common/types";

const newPhaseRegularSeason = async (): Promise<PhaseReturn> => {
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: ["cid", "did"],
		season: g.get("season"),
		active: true,
	});

	await season.setSchedule(season.newSchedule(teams));

	if (g.get("autoDeleteOldBoxScores")) {
		const transaction = idb.league.transaction("games", "readwrite");

		// Delete all games except past 3 seasons
		await iterate(
			transaction.store.index("season"),
			IDBKeyRange.upperBound(g.get("season") - 3),
			undefined,
			({ gid }) => {
				transaction.objectStore("games").delete(gid);
			},
		);

		await transaction.done;
	}

	const sport = helpers.upperCaseFirstLetter(process.env.SPORT);
	const subreddit =
		process.env.SPORT === "basketball" ? "BasketballGM" : "Football_GM";

	if (!local.autoPlayUntil) {
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
				text: `<b>Mailing List</b><br>If you'd like to recieve a quarterly email containing the latest news about ${helpers.upperCaseFirstLetter(
					process.env.SPORT,
				)} GM, <a href="https://landing.mailerlite.com/webforms/landing/z7d2z9" target="_blank" rel="noopener noreferrer">subscribe to our newsletter here</a>.`,
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
					text: `<p>Hi. Sorry to bother you, but I noticed that you've been playing this game a bit. Hopefully that means you like it. Either way, I would really appreciate some feedback to help me make it better. <a href="mailto:commissioner@${process.env.SPORT}-gm.com">Send an email</a> (commissioner@${process.env.SPORT}-gm.com) or join the discussion on <a href="http://www.reddit.com/r/${subreddit}/">Reddit</a> or <a href="https://discord.gg/caPFuM9">Discord</a>.</p>`,
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
						text: `<p>Hi. Sorry to bother you again, but if you like the game, please share it with your friends! Also:</p><p><a href="https://twitter.com/${
							process.env.SPORT === "basketball"
								? "basketball_gm"
								: "FootballGM_Game"
						}">Follow ${sport} GM on Twitter</a></p><p><a href="https://www.facebook.com/${
							process.env.SPORT
						}.general.manager">Like ${sport} GM on Facebook</a></p><p><a href="http://www.reddit.com/r/${subreddit}/">Discuss ${sport} GM on Reddit</a></p><p><a href="https://discord.gg/caPFuM9">Chat with ${sport} GM players and devs on Discord</a></p><p>The more people that play ${sport} GM, the more motivation I have to continue improving it. So it is in your best interest to help me promote the game! If you have any other ideas, please <a href="mailto:commissioner@${
							process.env.SPORT
						}-gm.com">email me</a>.</p>`,
					});
				} else if (
					process.env.SPORT === "basketball" &&
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
						text:
							'<p>Want to try multiplayer Basketball GM? Some intrepid souls have banded together to form online multiplayer leagues, and <a href="https://www.reddit.com/r/BasketballGM/wiki/basketball_gm_multiplayer_league_list">you can find a user-made list of them here</a>.</p>',
					});
				}
			}
		}
	}

	if (
		navigator.storage &&
		navigator.storage.persist &&
		navigator.storage.persisted
	) {
		let persisted = await navigator.storage.persisted();

		// If possible to get persistent storage without prompting the user, do it!
		if (!persisted) {
			try {
				if (navigator.permissions && navigator.permissions.query) {
					const permission = await navigator.permissions.query({
						name: "persistent-storage",
					});

					if (permission.state === "granted") {
						persisted = await navigator.storage.persist();
					}
				}
			} catch (error) {
				// Old browsers might error if they don't recognize the "persistent-storage" permission, but who cares
				console.error(error);
			}
		}

		// If still not persisted, notify user with some probabilitiy
		if (!persisted && Math.random() < 0.1) {
			logEvent({
				extraClass: "",
				persistent: true,
				saveToDb: false,
				text: `<b>Persistent Storage</b><br><div>Game data in your browser profile, so <a href="https://basketball-gm.com/manual/faq/#missing-leagues">sometimes it can be inadvertently deleted</a>. Enabling persistent storage helps protect against this.<br><center><button class="btn btn-primary mt-2" onClick="navigator.storage.persist().then((result) => { this.parentElement.parentElement.innerHTML = (result ? 'Success!' : 'Failed to enable persistent storage!') + ' You can always view your persistent storage settings by going to Tools > Options.'; })">Enable Persistent Storage</button></center></div>`,
				type: "info",
			});
		}
	}

	return {
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseRegularSeason;
