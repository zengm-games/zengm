import { idb } from "../db";
import { g, getTeamInfoBySeason } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	DiscriminateUnion,
	EventBBGM,
	Phase,
	ThenArg,
} from "../../common/types";
import orderBy from "lodash-es/orderBy";
import { processAssets } from "./tradeSummary";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

type TradeEvent = DiscriminateUnion<EventBBGM, "type", "trade">;

const isTradeEvent = (event: EventBBGM): event is TradeEvent => {
	return event.type === "trade";
};

type Team = {
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	assets: ThenArg<ReturnType<typeof processAssets>>;
	statSum: number;
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

	let statSum = 0;
	for (const asset of assets) {
		// https://github.com/microsoft/TypeScript/issues/21732
		const stat = (asset as any).stat;
		if (typeof stat === "number") {
			statSum += stat;
		}
	}

	return {
		tid,
		abbrev: teamInfo.abbrev,
		region: teamInfo.region,
		name: teamInfo.name,
		assets,
		statSum,
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
				let scoreMax = 0;
				for (const t of teams) {
					for (const asset of t.assets) {
						// https://github.com/microsoft/TypeScript/issues/21732
						const { ovr, pot } = asset as any;
						if (typeof ovr === "number" && typeof pot === "number") {
							const score = ovr + 0.25 * pot;
							if (score > scoreMax) {
								scoreMax = score;
							}
						}
					}
				}
				return { value: scoreMax };
			};
			sortParams = [["most.value"], ["desc"]];
		} else if (type === "lopsided") {
			title = "Most Lopsided Trades";
			description =
				"Trades where one team's assets produced a lot more value than the other.";

			getValue = teams => {
				const value = Math.abs(teams[0].statSum - teams[1].statSum);

				return { value };
			};
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
			challengeNoRatings: g.get("challengeNoRatings"),
			description,
			title,
			trades,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default frivolitiesTrades;
