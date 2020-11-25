import { league } from "../core";
import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import local from "./local";
import type { OwnerMood } from "../../common/types";

const moodTexts = ["Horrible!", "Bad.", "Pretty good.", "Good.", "Excellent!"];

const getMoodScore = (total: number, deltas: boolean = false) => {
	if (total >= (deltas ? 0.5 : 2)) {
		return 4;
	}

	if (total >= (deltas ? 0.25 : 1)) {
		return 3;
	}

	if (total >= 0) {
		return 2;
	}

	if (total > (deltas ? -0.25 : -0.5)) {
		return 1;
	}

	return 0;
};

const genMessage = async (deltas: OwnerMood, cappedDeltas: OwnerMood) => {
	// If auto play seasons or multi team mode, no messages
	if (
		local.autoPlayUntil ||
		g.get("spectator") ||
		g.get("userTids").length > 1
	) {
		return;
	}

	// No need for seasons before you GMed this team or more than 10 years old, but also make sure we always have g.get("season")
	const minSeason = Math.min(
		g.get("season"),
		Math.max(g.get("gracePeriodEnd") - 2, g.get("season") - 9),
	);
	const teamSeasons = await idb.getCopies.teamSeasons({
		tid: g.get("userTid"),
		seasons: [minSeason, g.get("season")],
	});
	const moods = teamSeasons.map(ts => {
		return ts.ownerMood
			? ts.ownerMood
			: {
					money: 0,
					playoffs: 0,
					wins: 0,
			  };
	});

	let m = "";
	let fired = false;

	// Check for some challenge modes that can result in being fired
	if (g.get("challengeFiredLuxuryTax")) {
		const latestSeason = teamSeasons[teamSeasons.length - 1];
		if (latestSeason.expenses.luxuryTax.amount > 0) {
			m +=
				'<p>You paid the luxury tax with the "You\'re fired if you pay the luxury tax" challenge mode enabled!</p>';
			fired = true;
		}
	}
	if (g.get("challengeFiredMissPlayoffs")) {
		const latestSeason = teamSeasons[teamSeasons.length - 1];
		if (latestSeason.playoffRoundsWon < 0) {
			m +=
				'<p>You missed the playoffs with the "You\'re fired if you miss the playoffs" challenge mode enabled!</p>';
			fired = true;
		}
	}

	// If challenge mode didn't trigger a firing, do normal stuff
	if (!fired) {
		const currentMood =
			moods.length > 0
				? moods[moods.length - 1]
				: {
						money: 0,
						playoffs: 0,
						wins: 0,
				  };
		const currentTotal =
			currentMood.wins + currentMood.playoffs + currentMood.money;
		fired =
			currentTotal <= -1 &&
			g.get("season") >= g.get("gracePeriodEnd") &&
			!g.get("godMode");

		if (!fired) {
			let overall;

			if (g.get("season") < g.get("gracePeriodEnd")) {
				overall = "It's too early to judge you.";
			} else if (g.get("godMode")) {
				overall = "You're using God Mode, so who cares what I think?";
			} else {
				overall = moodTexts[getMoodScore(currentTotal)];
			}

			const deltasTotal = deltas.wins + deltas.playoffs + deltas.money;
			const deltasMoodScore = getMoodScore(deltasTotal, true);
			const cappedDeltasTotal =
				cappedDeltas.wins + cappedDeltas.playoffs + cappedDeltas.money;
			const cappedDeltasMoodScore = getMoodScore(cappedDeltasTotal, true); // Average the capped and uncapped scores, unless perfect

			const avgMoodScore =
				currentTotal >= 2.99
					? deltasMoodScore
					: Math.round((deltasMoodScore + cappedDeltasMoodScore) / 2);
			const thisYear = moodTexts[avgMoodScore];
			let text;

			if (currentTotal >= 0) {
				if (deltas.playoffs >= 0 && deltas.wins >= 0) {
					if (deltas.money < 0) {
						text = `Keep it up on the ${
							process.env.SPORT === "basketball" ? "court" : "field"
						}, but I need more money.`;
					} else {
						text = "Keep it up.";
					}
				} else {
					text = "Hopefully you'll win some more games next season.";

					if (deltas.money < 0) {
						text += " And try to make some more money too!";
					}
				}
			} else if (
				deltas.playoffs >= 0 &&
				deltas.wins >= 0 &&
				deltas.money >= 0
			) {
				text = "Keep it up.";
			} else if (deltas.playoffs < 0 && deltas.money < 0) {
				text = "Somehow you need to win more and make more money.";
			} else if (deltas.playoffs < 0) {
				text = "Win some more games next season.";
			} else if (deltas.money < 0) {
				text = "Be careful about losing too much money.";
			}

			if (g.get("season") >= g.get("gracePeriodEnd")) {
				if (currentTotal + deltas.money + deltas.playoffs + deltas.wins < -1) {
					text = "Another season like that and you're fired!";
				} else if (
					currentTotal + 2 * (deltas.money + deltas.playoffs + deltas.wins) <
					-1
				) {
					text = "A couple more seasons like that and you're fired!";
				}
			}

			m += `<p>This year: ${thisYear}</p><p>Overall: ${overall}</p>`;

			if (text) {
				m += `<p>${text}</p>`;
			}

			const prob = helpers.bound(currentTotal, 0, 3) / 5;
			const otherTeamsWantToHire = Math.random() < prob;

			await league.setGameAttributes({
				otherTeamsWantToHire,
			});
		} else {
			// Fired!
			if (
				currentMood.wins < 0 &&
				currentMood.playoffs < 0 &&
				currentMood.money < 0
			) {
				m += "<p>You've been an all-around disappointment. You're fired.</p>";
			} else if (
				currentMood.money < 0 &&
				currentMood.wins >= 0 &&
				currentMood.playoffs >= 0
			) {
				m +=
					"<p>You've won some games, but you're just not making me enough profit. It's not all about wins and losses, dollars matter too. You're fired.</p>";
			} else if (
				currentMood.money >= 0 &&
				currentMood.wins < 0 &&
				currentMood.playoffs < 0
			) {
				m += `<p>I like that you've made a nice profit for me, but you're not putting a competitive team on the ${
					process.env.SPORT === "basketball" ? "court" : "field"
				}. We need a new direction. You're fired.</p>`;
			} else {
				m += "<p>You're fired.</p>";
			}
		}
	}

	if (fired) {
		m += `<p>I hear a few other teams are looking for a new GM. <a href="${helpers.leagueUrl(
			["new_team"],
		)}">Take a look.</a> Please, go run one of those teams into the ground.</p>`;
		await league.setGameAttributes({
			gameOver: true,
		});
	}

	await idb.cache.messages.add({
		read: false,
		from: "The Owner",
		year: g.get("season"),
		text: m,
		subject: "Annual performance evaluation",
		ownerMoods: moods,
	});
};

export default genMessage;
