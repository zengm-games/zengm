import retire from "./retire";
import { idb } from "../../db";
import { g, helpers, logEvent, random } from "../../util";
import type { Conditions, Player } from "../../../common/types";

const killOne = async (conditions: Conditions, player?: Player) => {
	const gifts = [
		"basketball shorts",
		"jerseys",
		"athletic socks",
		"knee sleeves",
		"elbow sleeves",
		"compression pants",
		"ankle braces",
		"knee braces",
		...(process.env.SPORT === "football"
			? ["cleats", "helmets", "shoulder pads"]
			: ["sneakers", "headbands"]),
	];
	const gift1 = random.choice(gifts);
	const gift2 = random.choice(gifts.filter(gift => gift !== gift1));

	const reason = random.choice([
		"died from a drug overdose",
		"was killed by a gunshot during an altercation at a night club",
		"was eaten by wolves. He was delicious",
		"died in a car crash",
		"was stabbed to death by a jealous ex-girlfriend",
		"committed suicide",
		"died from a rapidly progressing case of ebola",
		"was killed in a bar fight",
		"died after falling out of his 13th floor hotel room",
		"was shredded to bits by the team plane's propeller",
		"was hit by a stray meteor",
		"accidentally shot himself in the head while cleaning his gun",
		"was beheaded by ISIS",
		"spontaneously combusted",
		"had a stroke after reading about the owner's plans to trade him",
		"died of exertion while trying to set the record for largest number of sex partners in one day",
		"rode his Segway off a cliff",
		"fell into the gorilla pit at the zoo and was dismembered as the staff decided not to shoot the gorilla",
		"was pursued by a bear, and mauled", // poor Antigonus
		"was smothered by a throng of ravenous, autograph-seeking fans after exiting the team plane",
		`was killed by ${random.choice([
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
		])}`,
		"suffered a heart attack in the team training facility and died",
		"was lost at sea and is presumed dead",
		"was run over by a car",
		"was run over by a car, and then was run over by a second car. Police believe only the first was intentional",
		"cannot be found and is presumed dead. Neighbors reported strange lights in the sky above his house last night",
		"fell off the edge of the flat earth",
		"died a normal death. Move on, find a new slant",
		"was shot by police while shoplifting in China",
		"fell to his death after slapping the backboard of a hoop inexplicably placed in front of a flimsy window on the 3rd floor of a building",
		"died from an adult onset peanut allergy while eating his pre-game PB&J sandwich",
		"fell into a wood chipper",
		"died from a skull fracture after hitting his head on the rim while practicing for a dunk contest",
		"was killed in swatting attack during a heated game of Fortnite",
		"choked to death on a pretzel",
		"was murdered by a time traveler so he would not become the world's evil overlord following his playing days",
		'removed the "Do Not Remove" tag from a newly purchased mattress and was promptly devoured by mattress gnomes',
		"died of dysentery",
		"was strangled to death by a teammate for not knowing the score",
		"died in a freak gasoline fight accident",
		"was intensely focused on playing Basketball GM on his cell phone. As he walked across the street, he was so distracted by his ultimately fatal obsession that he didn't notice the bus barreling towards him",
		"drowned while crossing the Saleph River",
		"uploaded himself to the cloud and can no longer participate in corporeal pursuits",

		// Draco, an Athenian lawmaker, was reportedly smothered to death by gifts of cloaks and hats showered upon him by appreciative citizens
		`was smothered to death by gifts of ${gift1} and ${gift2} showered upon him by appreciative fans`,
	]);

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

	p.diedYear = g.get("season");
	await idb.cache.players.put(p);
	logEvent(
		{
			type: "tragedy",
			text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${
				p.lastName
			}</a> ${reason}.`,
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
