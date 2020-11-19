import { idb } from "../db";
import { g, getTeamInfoBySeason, helpers } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	DiscriminateUnion,
	EventBBGM,
	Phase,
	ThenArg,
} from "../../common/types";
import orderBy from "lodash/orderBy";
import { processAssets } from "./tradeSummary";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

type TradeEvent = DiscriminateUnion<EventBBGM, "type", "trade">;

const isTradeEvent = (event: EventBBGM): event is TradeEvent => {
	return event.type === "trade";
};

type AssetPlayer = {
	type: "player";
	pid: number;
	name: string;
	ovr: number;
	pot: number;
	watch: boolean;
};

type Team = {
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	assets: ThenArg<ReturnType<typeof processAssets>>;
	stat: number;
};

type Trade = {
	rank: number;
	eid: number;
	season: number;
	phase: Phase;
	teams: [Team, Team];
	most: Most;
};

const genTeam = async (event: TradeEvent, i: 0 | 1): Promise<Team> => {
	const tid = event.tids[i];
	const teamInfo = await getTeamInfoBySeason(tid, event.season);
	if (!teamInfo) {
		throw new Error("teamInfo not found");
	}

	const assets = await processAssets(event, i);

	let stat = 0;

	return {
		tid,
		abbrev: teamInfo.abbrev,
		region: teamInfo.region,
		name: teamInfo.name,
		assets,
		stat,
	};
};

const getMostXRows = async ({
	filter,
	getValue,
	sortParams,
}: {
	filter?: (event: TradeEvent) => boolean;
	getValue: (ts: [Team, Team]) => Most;
	sortParams?: any;
}) => {
	const LIMIT = 100;
	const trades: Trade[] = [];

	const events: TradeEvent[] = [];

	// Would be nice to not read these all into memory, but then would have to pass around the transaction to genTeam and others
	let cursor = await idb.league.transaction("events").store.openCursor();
	while (cursor) {
		const event = cursor.value;
		if (isTradeEvent(event)) {
			events.push(event);
		}
		cursor = await cursor.continue();
	}

	for (const event of events) {
		if (event.phase === undefined || !event.teams) {
			continue;
		}

		if (filter !== undefined && !filter(event)) {
			continue;
		}

		const teams = [await genTeam(event, 0), await genTeam(event, 1)] as [
			Team,
			Team,
		];

		const most = getValue(teams);

		trades.push({
			rank: 0,
			eid: event.eid,
			season: event.season,
			phase: event.phase,
			teams,
			most,
		});

		trades.sort((a, b) => b.most.value - a.most.value);

		if (trades.length > LIMIT) {
			trades.pop();
		}
	}

	const ordered = orderBy(trades, ...sortParams);
	for (let i = 0; i < ordered.length; i++) {
		ordered[i].rank = i + 1;
	}

	return ordered;
};

const frivolitiesTrades = async (
	{ abbrev, tid, type }: ViewInput<"frivolitiesTrades">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (
		updateEvents.includes("firstRun") ||
		type !== state.type ||
		abbrev !== state.abbrev
	) {
		let filter: Parameters<typeof getMostXRows>[0]["filter"];
		let getValue: Parameters<typeof getMostXRows>[0]["getValue"];
		let sortParams: any;
		let title: string;
		let description: string | undefined;

		if (type === "biggest") {
			title = "Biggest Trades";
			description = "Trades involving the best players and prospects.";

			getValue = teams => {
				let score = 0;
				for (const t of teams) {
					for (const asset of t.assets) {
						if (typeof asset.ovr === "number") {
							score += asset.ovr;
						}
					}
				}
				return { value: score };
			};
			sortParams = [["most.value"], ["desc"]];
		} else if (type === "lopsided") {
			title = "Most Lopsided Trades";
			description =
				"Trades where one team's assets got a lot more production than the other.";

			getValue = teams => ({
				value: 0,
			});
			sortParams = [["most.value"], ["desc"]];
		} else {
			throw new Error(`Unknown type "${type}"`);
		}

		if (tid >= 0) {
			filter = event => event.tids.includes(tid);
		}

		const trades = await getMostXRows({
			filter,
			getValue,
			sortParams,
		});

		return {
			abbrev,
			description,
			title,
			trades,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default frivolitiesTrades;
