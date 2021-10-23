import streamSaver from "streamsaver";
import { helpers } from ".";
import {
	gameAttributesKeysGameState,
	gameAttributesKeysTeams,
} from "../../common/defaultGameAttributes";
import { types } from "../../common/transactionInfo";
import type {
	EventBBGM,
	GameAttribute,
	Player,
	Team,
} from "../../common/types";
import stats from "../../worker/core/player/stats";
import type { ExportLeagueKey } from "../views/ExportLeague";

type Checked = Record<ExportLeagueKey, boolean> & {
	compressed: boolean;
};

export const getExportInfo = (checked: Checked) => {
	const storesSet = new Set<string>();

	const storesByKey = {
		players: ["players", "releasedPlayers", "awards"],
		teamsBasic: ["teams"],
		teams: ["teamSeasons", "teamStats"],
		headToHead: ["headToHeads"],
		schedule: ["schedule", "playoffSeries"],
		draftPicks: ["draftPicks"],
		leagueSettings: ["gameAttributes"],
		gameState: [
			"gameAttributes",
			"trade",
			"negotiations",
			"draftLotteryResults",
			"messages",
			"playerFeats",
			"allStars",
			"scheduledEvents",
		],
		newsFeedTransactions: ["events"],
		newsFeedOther: ["events"],
		games: ["games"],
	};

	for (const key of helpers.keys(storesByKey)) {
		if (checked[key]) {
			for (const store of storesByKey[key]) {
				storesSet.add(store);
			}
		}
	}

	const stores = Array.from(storesSet);

	const filter: any = {};
	if (checked.newsFeedTransactions && !checked.newsFeedOther) {
		filter.events = (event: EventBBGM) => {
			const category = types[event.type]?.category;
			return category === "transaction" || category === "draft";
		};
	} else if (!checked.newsFeedTransactions && checked.newsFeedOther) {
		filter.events = (event: EventBBGM) => {
			const category = types[event.type]?.category;
			return category !== "transaction" && category !== "draft";
		};
	} else if (checked.leagueSettings || checked.gameState) {
		filter.gameAttributes = (row: GameAttribute) => {
			if (!checked.leagueSettings) {
				if (
					!gameAttributesKeysGameState.includes(row.key) &&
					!gameAttributesKeysTeams.includes(row.key)
				) {
					return false;
				}
			}

			if (!checked.gameState) {
				if (gameAttributesKeysGameState.includes(row.key)) {
					return false;
				}
			}

			if (!checked.teams) {
				if (gameAttributesKeysTeams.includes(row.key)) {
					return false;
				}
			}

			return true;
		};
	}

	const forEach: any = {};
	if (checked.players && !checked.gameHighs) {
		forEach.players = (p: Player) => {
			for (const row of p.stats) {
				for (const stat of stats.max) {
					delete row[stat];
				}
			}
		};
	}

	const map: any = {};
	const teamsBasicOnly = checked.teamsBasic && !checked.teams;
	if (teamsBasicOnly) {
		map.teams = (t: Team) => {
			return {
				tid: t.tid,
				abbrev: t.abbrev,
				region: t.region,
				name: t.name,
				imgURL: t.imgURL,
				imgURLSmall: t.imgURLSmall,
				colors: t.colors,
				jersey: t.jersey,
				cid: t.cid,
				did: t.did,
				pop: t.pop,
				stadiumCapacity: t.stadiumCapacity,
				disabled: t.disabled,
				srID: t.srID,
			};
		};
	}

	return {
		stores,
		filter,
		forEach,
		map,
	};
};

// Why is this in UI? streamsaver does not work in worker. Otherwise it would be better there.
const downloadFileStream = async (
	filename: string,
	readableStream: ReadableStream,
) => {
	let fileStream: WritableStream;
	if (window.showSaveFilePicker) {
		const fileHandle = await window.showSaveFilePicker({
			suggestedName: filename,
			types: [
				{
					description: "JSON Files",
					accept: {
						"application/json": [".json"],
					},
				},
			],
		} as any);

		fileStream = await fileHandle.createWritable();
	} else {
		fileStream = streamSaver.createWriteStream(filename);
	}

	await readableStream.pipeThrough(new TextEncoderStream()).pipeTo(fileStream);
};

export default downloadFileStream;
