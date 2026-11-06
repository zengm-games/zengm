import { PLAYER, PHASE } from "../../common/constants.ts";
import { finances, player } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	FlatContractInfo,
	PlayerWithoutKey,
	Player,
} from "../../common/types.ts";
import { getCurrentContract } from "../../common/contracts.ts";
import {
	getLatestContractSummary,
	isFlatContract,
} from "../core/contract/index.ts";
import { getContractStartSeason } from "../util/getContractStartSeason.ts";
import { defineView } from "../util/defineView.ts";
import { last, orderBy } from "../../common/utils.ts";
import { upgradeFace } from "../util/face.ts";
import type { RouteParams } from "../../ui/router/types.ts";

const processInputs = (params: RouteParams<"customizePlayer">) => {
	let pid: number | null = null;
	if (params.pid !== undefined) {
		pid = Number.parseInt(params.pid);
		if (Number.isNaN(pid) || pid < 0) {
			pid = null;
		}
	}

	let type: "clone" | undefined;
	if (params.type === "clone" && pid !== null) {
		type = "clone";
	}

	return {
		pid,
		type,
	};
};

export const formatPlayerRelativesList = (p: Player) => {
	const firstSeason = p.ratings[0].season;
	const lastSeason = last(p.ratings).season;

	return {
		pid: p.pid,
		firstName: p.firstName,
		lastName: p.lastName,
		firstSeason,
		lastSeason,
	};
};

export const finalizePlayersRelativesList = (
	players: ReturnType<typeof formatPlayerRelativesList>[],
) => {
	return orderBy(players, [
		"lastName",
		"firstName",
		"firstSeason",
		"lastSeason",
	]);
};

let faceCount = 0;

export default defineView({
	id: "customizePlayer",
	processInputs,
	load: async ({ inputs, updateEvents }) => {
		if (!g.get("godMode") && inputs.pid === null) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage:
					"You can't create new players unless you enable God Mode.",
			};
			return returnValue;
		}

		if (updateEvents.has("firstRun")) {
			const teams = (await idb.cache.teams.getAll())
				.filter((t) => !t.disabled)
				.map((t) => {
					return {
						tid: t.tid,
						text: `${t.region} ${t.name}`,
					};
				});

			let appearanceOption;
			let originalTid;

			// What's shown in the contract fields, which is the current contract or contract demand
			let contract: FlatContractInfo | undefined;

			// Seasons of the current contract that can still be edited, for editing different amounts in different seasons
			let contractSeasons: { start: number; amounts: number[] } | undefined;

			let p: PlayerWithoutKey;
			if (inputs.pid === null) {
				// Generate new player as basis
				const scoutingLevel = await finances.getLevelLastThree("scouting", {
					tid: g.get("userTid"),
				});
				const name = await player.name();
				p = player.generate(
					PLAYER.FREE_AGENT,
					20,
					g.get("phase") <= PHASE.DRAFT ? g.get("season") - 1 : g.get("season"),
					false,
					scoutingLevel,
					name,
				);
				appearanceOption = "Cartoon Face";
				p.imgURL = "http://";
				contract = p.contractDemand;
			} else {
				// Load a player to edit
				const p2 = await idb.merged.players.get(inputs.pid);

				if (!p2) {
					// https://stackoverflow.com/a/59923262/786644
					const returnValue = {
						errorMessage: "Player not found.",
					};
					return returnValue;
				}

				// Copy because the player is edited below
				p = helpers.deepCopy(p2);

				contract = getLatestContractSummary(p2);

				// Seasons that were already paid can't be changed
				const currentContract = getCurrentContract(p2);
				if (currentContract && !p2.contractDemand) {
					const start = Math.max(
						currentContract.start,
						getContractStartSeason(),
					);
					const amounts = currentContract.amounts.slice(
						start - currentContract.start,
					);
					if (amounts.length > 0) {
						contractSeasons = { start, amounts };
					}
				}

				await upgradeFace(p);

				if (p.imgURL.length > 0) {
					appearanceOption = "Image URL";
				} else {
					appearanceOption = "Cartoon Face";
					p.imgURL = "http://";
				}

				originalTid = p.tid;

				if (inputs.type === "clone") {
					delete p.pid;
					p.awards = [];
					p.stats = [];
					p.draft = {
						...p.draft,
						round: 0,
						pick: 0,
						tid: -1,
						originalTid: -1,
						pot: 0,
						ovr: 0,
						skills: [],
					};
					p.contracts = [];
					delete p.owedByTids;
					contractSeasons = undefined;
				}
			}

			const currentPlayers = await idb.cache.players.getAll();
			const pids = new Set(currentPlayers.map((p) => p.pid));

			for (const relative of p.relatives) {
				if (!pids.has(relative.pid)) {
					const pRelative = await idb.merged.players.get(relative.pid);
					if (pRelative) {
						currentPlayers.push(pRelative);
					}
				}
			}

			const playersRelativesList = finalizePlayersRelativesList(
				currentPlayers.map(formatPlayerRelativesList),
			);

			const initialAutoPos = player.pos(last(p.ratings));

			faceCount += 1;

			contract ??= {
				amount: g.get("minContract"),
				exp: g.get("season"),
			};

			// For a new contract, the seasons of the flat contract
			if (!contractSeasons) {
				const start = getContractStartSeason();
				const amounts = [];
				for (let s = start; s <= Math.max(contract.exp, start); s++) {
					amounts.push(contract.amount);
				}
				contractSeasons = { start, amounts };
			}

			return {
				appearanceOption,
				contract,
				contractSeasons,
				contractVariable: !isFlatContract(contractSeasons),
				faceCount,
				initialAutoPos,
				originalTid,
				p,
				playerMoodTraits: g.get("playerMoodTraits"),
				playersRelativesList,
				teams,
			};
		}
	},
});
