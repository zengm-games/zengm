import {
	gameAttributesKeysGameState,
	gameAttributesKeysTeams,
} from "../../common/defaultGameAttributes";
import type {
	EventBBGM,
	GameAttribute,
	Player,
	Team,
} from "../../common/types";
import type { ExportLeagueKey } from "../../ui/views/ExportLeague";
import { g, helpers } from "../util";
import { types } from "../../common/transactionInfo";
import stats from "../core/player/stats";
import { league } from "../core";

type Checked = Record<ExportLeagueKey, boolean> & {
	compressed: boolean;
};

const getExportInfo = (checked: Checked) => {
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

export const exportLeague = async (checked: Checked) => {
	const { stores, filter, forEach, map } = getExportInfo(checked);

	const data = await league.exportLeague(stores, {
		filter,
		forEach,
		map,
	});

	// Include confs and divs if exporting just teams, in case gameAttributes was not selected
	if (checked.teamsBasic) {
		data.gameAttributes = data.gameAttributes ?? {};
		data.gameAttributes.confs = data.gameAttributes.confs ?? g.get("confs");
		data.gameAttributes.divs = data.gameAttributes.divs ?? g.get("divs");
	}

	// Include startingSeason when necessary (historical data but no game state)
	const hasHistoricalData =
		checked.players ||
		checked.teams ||
		checked.headToHead ||
		checked.schedule ||
		checked.draftPicks;
	if (
		hasHistoricalData &&
		(!data.gameAttributes || data.gameAttributes.startingSeason === undefined)
	) {
		data.startingSeason = g.get("season");
	}

	const json = JSON.stringify(data, null, checked.compressed ? undefined : 2);
	return json;
};

export const exportLeagueFSA = async (
	fileHandle: FileSystemFileHandle,
	checked: Checked,
) => {
	const { stores, filter, forEach, map } = getExportInfo(checked);
	console.log(fileHandle, stores);

	await league.exportLeagueFSA(fileHandle, stores, {
		compressed: checked.compressed,
	});
};
