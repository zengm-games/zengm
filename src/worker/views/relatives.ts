import { idb } from "../db/index.ts";
import { g, helpers, processPlayersHallOfFame } from "../util/index.ts";
import type {
	UpdateEvents,
	Player,
	ViewInput,
	GameAttributesLeague,
} from "../../common/types.ts";
import { bySport } from "../../common/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

const getRelationText = (
	gender: GameAttributesLeague["gender"],
	generation: number,
	directLine: boolean,
	brother: boolean,
	spouse: boolean,
) => {
	if (generation === 0) {
		return directLine
			? "Self"
			: brother
				? helpers.getRelativeType(gender, "brother")
				: spouse
					? "Spouse"
					: "Cousin";
	}

	if (generation === 1) {
		return directLine
			? helpers.getRelativeType(gender, "father")
			: helpers.getRelativeType(gender, "uncle");
	}

	if (generation === 2) {
		return directLine
			? helpers.getRelativeType(gender, "grandfather")
			: `Great ${helpers.getRelativeType(gender, "uncle")}`;
	}

	if (generation === 3) {
		return directLine
			? `Great ${helpers.getRelativeType(gender, "grandfather")}`
			: `2nd Great ${helpers.getRelativeType(gender, "uncle")}`;
	}

	if (generation > 3) {
		if (directLine) {
			return `${helpers.ordinal(
				generation - 2,
			)} Great ${helpers.getRelativeType(gender, "grandfather")}`;
		} else {
			return `${helpers.ordinal(
				generation - 1,
			)} Great ${helpers.getRelativeType(gender, "uncle")}`;
		}
	}

	if (generation === -1) {
		return directLine
			? helpers.getRelativeType(gender, "son")
			: helpers.getRelativeType(gender, "nephew");
	}

	if (generation === -2) {
		return directLine
			? helpers.getRelativeType(gender, "grandson")
			: `Great ${helpers.getRelativeType(gender, "nephew")}`;
	}

	if (generation === -3) {
		return directLine
			? `Great ${helpers.getRelativeType(gender, "grandson")}`
			: `2nd Great ${helpers.getRelativeType(gender, "nephew")}`;
	}

	if (generation < -3) {
		if (directLine) {
			return `${helpers.ordinal(
				Math.abs(generation + 2),
			)} Great ${helpers.getRelativeType(gender, "grandson")}`;
		} else {
			return `${helpers.ordinal(
				Math.abs(generation + 1),
			)} Great ${helpers.getRelativeType(gender, "nephew")}`;
		}
	}

	return "???";
};

const updatePlayers = async (
	{ pid }: ViewInput<"relatives">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun") || pid !== state.pid) {
		const stats = bySport({
			baseball: ["gp", "keyStats", "war"],
			basketball: [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"per",
				"ewa",
				"ws",
				"ws48",
			],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});

		let playersAll: Player[] = [];
		const generations: number[] = [];

		// Anyone who is directly a father or son of the initial player, and their fathers/sons
		const fatherLinePids = new Set<number>();
		const sonLinePids = new Set<number>();

		// Brothers of initial player, that's it
		const brotherPids = new Set<number>();

		// If the initial player has a son with multiple fathers, those other fathers should be labeled as spouses
		const spousePids = new Set<number>();

		if (typeof pid === "number") {
			const pidsSeen = new Set();
			fatherLinePids.add(pid);
			sonLinePids.add(pid);

			const addPlayers = async (
				infos: {
					pid: number;
					generation: number;
				}[],
				initial: boolean,
			) => {
				const players = await idb.getCopies.players(
					{
						pids: infos.map((info) => info.pid),
					},
					"noCopyCache",
				);

				const infosNext: typeof infos = [];

				// Make sure we don't add the same player to infosNext twice
				const pidsSeenLocal = new Set();

				for (const p of players) {
					if (pidsSeen.has(p.pid)) {
						continue;
					}

					const info = infos.find((info) => info.pid === p.pid);
					if (!info) {
						continue;
					}

					playersAll.push(p);
					generations.push(info.generation);
					pidsSeen.add(p.pid);

					let sonOfInitialPlayer = false;
					const otherFathers = [];

					for (const relative of p.relatives) {
						if (info.generation === -1 && relative.type === "father") {
							if (relative.pid === pid) {
								sonOfInitialPlayer = true;
							} else {
								otherFathers.push(relative);
							}
						}

						if (fatherLinePids.has(p.pid) && relative.type === "father") {
							fatherLinePids.add(relative.pid);
						}

						if (sonLinePids.has(p.pid) && relative.type === "son") {
							sonLinePids.add(relative.pid);
						}

						if (pidsSeenLocal.has(relative.pid)) {
							continue;
						}
						pidsSeenLocal.add(relative.pid);

						if (initial && relative.type === "brother") {
							brotherPids.add(relative.pid);
						}

						let generation = info.generation;
						if (relative.type === "son") {
							generation -= 1;
						} else if (relative.type === "father") {
							generation += 1;
						}

						infosNext.push({
							pid: relative.pid,
							generation,
						});
					}

					if (sonOfInitialPlayer) {
						for (const otherFather of otherFathers) {
							spousePids.add(otherFather.pid);
						}
					}
				}

				if (infosNext.length > 0) {
					await addPlayers(infosNext, false);
				}
			};

			await addPlayers(
				[
					{
						pid,
						generation: 0,
					},
				],
				true,
			);
		} else {
			playersAll = await idb.getCopies.players(
				{
					filter: (p) => p.relatives.length > 0,
				},
				"noCopyCache",
			);
		}

		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
				"draft",
				"retiredYear",
				"statsTids",
				"hof",
				"relatives",
				"numBrothers",
				"numFathers",
				"numSons",
				"college",
				"jerseyNumber",
			],
			ratings: ["season", "ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});
		if (generations.length > 0) {
			for (const [i, p] of players.entries()) {
				const generation = generations[i];
				if (generation === undefined) {
					break;
				}
				p.relationText = getRelationText(
					g.get("gender"),
					generation,
					fatherLinePids.has(p.pid) || sonLinePids.has(p.pid),
					brotherPids.has(p.pid),
					spousePids.has(p.pid),
				);
			}
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			gender: g.get("gender"),
			pid,
			players: addFirstNameShort(processPlayersHallOfFame(players)),
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
