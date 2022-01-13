import retire from "./retire";
import { idb } from "../../db";
import { defaultTragicDeaths, g, helpers, logEvent, random } from "../../util";
import type { Conditions, Player } from "../../../common/types";
import { bySport } from "../../../common";

const getReason = () => {
	const tragicDeaths = g.get("tragicDeaths") ?? defaultTragicDeaths;

	let reason = random.choice(tragicDeaths, row => row.frequency).reason;
	if (reason === "SPECIAL_CLUE") {
		reason = `PLAYER_NAME was killed by ${random.choice([
			"Miss Scarlet",
			"Professor Plum",
			"Mrs. Peacock",
			"Reverend Green",
			"Colonel Mustard",
			"Mrs. White",
		])}, in the ${random.choice([
			"kitchen",
			"ballroom",
			"conservatory",
			"dining room",
			"cellar",
			"billiard room",
			"library",
			"lounge",
			"hall",
			"study",
		])}, with the ${random.choice([
			"candlestick",
			"dagger",
			"lead pipe",
			"revolver",
			"rope",
			"spanner",
		])}.`;
	} else if (reason === "SPECIAL_GIFTS") {
		const gifts = [
			"basketball shorts",
			"jerseys",
			"athletic socks",
			"knee sleeves",
			"elbow sleeves",
			"compression pants",
			"ankle braces",
			"knee braces",
			...bySport({
				basketball: ["sneakers", "headbands"],
				football: ["cleats", "helmets", "shoulder pads"],
				hockey: ["skates", "helmets", "shoulder pads", "gloves"],
			}),
		];
		const gift1 = random.choice(gifts);
		const gift2 = random.choice(gifts.filter(gift => gift !== gift1));

		// Draco, an Athenian lawmaker, was reportedly smothered to death by gifts of cloaks and hats showered upon him by appreciative citizens
		reason = `PLAYER_NAME was smothered to death by gifts of ${gift1} and ${gift2} showered upon him by appreciative fans.`;
	}

	return reason;
};

const killOne = async (conditions: Conditions, player?: Player) => {
	let p: Player;
	let tid;
	if (!player) {
		// Pick random team
		const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);
		tid = random.choice(teams).tid;
		const players = await idb.cache.players.indexGetAll("playersByTid", tid);

		// Pick a random player on that team
		p = random.choice(players.filter(p => !p.real));
		if (!p) {
			// Could happen, with real rosters
			return;
		}
	} else {
		p = player;
		tid = player.tid;
	}

	await retire(p, conditions, {
		logRetiredEvent: false,
	});

	const text = getReason().replace(
		"PLAYER_NAME",
		`<a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${
			p.lastName
		}</a>`,
	);

	p.diedYear = g.get("season");
	await idb.cache.players.put(p);
	logEvent(
		{
			type: "tragedy",
			text,
			showNotification: tid === g.get("userTid"),
			pids: [p.pid],
			tids: [tid],
			persistent: true,
			score: 20,
		},
		conditions,
	);
};

export default killOne;
