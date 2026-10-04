import { idb } from "../db/index.ts";
import { CacheTeamInfoSeason } from "../util/getTeamInfoBySeason.ts";
import type {
	DiscriminateUnion,
	EventBBGM,
	Phase,
} from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { processAssets } from "./tradeSummary.ts";
import { orderBy, type OrderBySortParams } from "../../common/utils.ts";
import { getWatchPids } from "./news.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateAbbrev } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"frivolitiesTrades">) => {
	let abbrev;
	let tid: number | undefined;
	const [validatedTid, validatedAbbrev] = validateAbbrev(params.abbrev, true);
	if (params.abbrev !== undefined && validatedAbbrev !== "???") {
		abbrev = validatedAbbrev;
		tid = validatedTid;
	} else if (params.abbrev === "watch") {
		abbrev = "watch";
	} else {
		abbrev = "all";
	}

	return {
		abbrev,
		tid,
		type: params.type,
	};
};

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
	assets: Awaited<ReturnType<typeof processAssets>>;
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

const genTeam = async (
	event: TradeEvent,
	i: 0 | 1,
	cacheTeamInfoSeason: CacheTeamInfoSeason,
): Promise<Team> => {
	const tid = event.tids[i];
	const teamInfo = await cacheTeamInfoSeason.get(tid);
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

type RequireOnly<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

const getMostXRows = async ({
	filter,
	getValue,
	sortParams,
}: {
	filter?: (event: TradeEvent) => boolean;
	getValue: (ts: [Team, Team]) => Most;
	sortParams: OrderBySortParams;
}) => {
	const LIMIT = 100;
	const trades: Trade[] = [];

	const events: RequireOnly<TradeEvent, "phase" | "teams">[] = [];

	// Would be nice to not read these all into memory, but then would have to pass around the transaction to genTeam and others
	const store = await idb.league.transaction("events").store;
	for await (const cursor of store) {
		const event = cursor.value;
		if (isTradeEvent(event)) {
			if (event.phase === undefined || !event.teams) {
				continue;
			}

			if (filter !== undefined && !filter(event)) {
				continue;
			}

			events.push(event as any);
		}
	}

	const eventsBySeason = Map.groupBy(events, (event) => event.season);

	for (const [season, eventsSeason] of eventsBySeason) {
		console.log(season, eventsSeason);
		const cache = new CacheTeamInfoSeason(season);

		for (const event of eventsSeason) {
			const teams = [
				await genTeam(event, 0, cache),
				await genTeam(event, 1, cache),
			] as [Team, Team];

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
	}

	const ordered = orderBy(trades, ...sortParams);
	for (const [i, row] of ordered.entries()) {
		row.rank = i + 1;
	}

	return ordered;
};

export default defineView({
	id: "frivolitiesTrades",
	processInputs,
	load: async ({ inputs: { abbrev, tid, type }, updateEvents, prevInputs }) => {
		// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
		if (
			updateEvents.has("firstRun") ||
			type !== prevInputs?.type ||
			abbrev !== prevInputs?.abbrev
		) {
			let filter: Parameters<typeof getMostXRows>[0]["filter"];
			let getValue: Parameters<typeof getMostXRows>[0]["getValue"];
			let sortParams: any;
			let title: string;
			let description: string | undefined;

			if (type === "biggest") {
				title = "Biggest Trades";
				description = "Trades involving the best players and prospects.";

				getValue = (teams) => {
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
				sortParams = [[(x: any) => x.most.value], ["desc"]];
			} else if (type === "lopsided") {
				title = "Most Lopsided Trades";
				description =
					"Trades where one team's assets produced a lot more value than the other.";

				getValue = (teams) => {
					const value = Math.abs(teams[0].statSum - teams[1].statSum);

					return { value };
				};
				sortParams = [[(x: any) => x.most.value], ["desc"]];
			} else {
				throw new Error(`Unknown type "${type}"`);
			}

			if (tid !== undefined) {
				filter = (event) => event.tids.includes(tid);
			} else if (abbrev === "watch") {
				const watchPids = await getWatchPids();
				filter = (event) => event.pids.some((pid) => watchPids.has(pid));
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
			};
		}
	},
});
