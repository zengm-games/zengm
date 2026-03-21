import { idb } from "../db/index.ts";
import g from "./g.ts";
import type {
	FeedEventType,
	GameResult,
	PlayerSummary,
	SocialContext,
	StandingEntry,
	StatLeader,
	TeamSummary,
	TransactionSummary,
} from "../../common/types.feedEvent.ts";

export async function getSocialContext(
	eventType: FeedEventType,
	liveStats?: {
		score: [number, number];
		quarter: number;
		statLeaders: StatLeader[];
	},
): Promise<SocialContext> {
	const currentSeason = g.get("season");
	const confs = g.get("confs", currentSeason);

	// ── Parallel IDB reads — all independent ──
	const [allTeamSeasons, allPlayers, allGames, allEvents, allTeams] =
		await Promise.all([
			idb.cache.teamSeasons.getAll(),
			idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
			idb.getCopies.games({ season: currentSeason }, "noCopyCache"),
			idb.league.getAll("events"),
			idb.cache.teams.getAll(),
		]);

	// ── Build conference name lookup: tid → conf name ──
	const tidToConfName: Record<number, string> = {};
	for (const t of allTeams) {
		if (t.disabled) {
			continue;
		}
		const conf = confs.find(
			(c: { cid: number; name: string }) => c.cid === t.cid,
		);
		tidToConfName[t.tid] = conf?.name ?? "";
	}

	// ── Filter to current season active teams ──
	const currentTeamSeasons = allTeamSeasons.filter(
		(ts) => ts.season === currentSeason && !ts.disabled,
	);

	// ── Sort by win pct descending to assign overall standing rank ──
	const sorted = [...currentTeamSeasons].sort((a, b) => {
		const pctA = a.won + a.lost > 0 ? a.won / (a.won + a.lost) : 0;
		const pctB = b.won + b.lost > 0 ? b.won / (b.won + b.lost) : 0;
		return pctB - pctA;
	});

	const tidToStanding: Record<number, number> = {};
	sorted.forEach((ts, i) => {
		tidToStanding[ts.tid] = i + 1;
	});

	// ── Build tid → team name lookup ──
	const tidToName: Record<number, string> = {};
	for (const ts of currentTeamSeasons) {
		tidToName[ts.tid] = ts.name;
	}

	// ── teams ──
	const teams: TeamSummary[] = currentTeamSeasons.map((ts) => ({
		tid: ts.tid,
		name: ts.name,
		abbrev: ts.abbrev,
		wins: ts.won,
		losses: ts.lost,
		standing: tidToStanding[ts.tid] ?? 0,
	}));

	// ── standings — derived from same read, sorted by win pct ──
	const standings: StandingEntry[] = sorted.map((ts) => ({
		tid: ts.tid,
		name: ts.name,
		abbrev: ts.abbrev,
		wins: ts.won,
		losses: ts.lost,
		pct: ts.won + ts.lost > 0 ? ts.won / (ts.won + ts.lost) : 0,
		conf: tidToConfName[ts.tid] ?? "",
	}));

	// ── players — rostered only (tid >= 0), top 20 by OVR ──
	const players: PlayerSummary[] = allPlayers
		.filter((p) => p.tid >= 0)
		.map((p) => {
			const latestRatings = p.ratings.at(-1);
			const seasonStats = p.stats.find(
				(s: { season: number; playoffs: boolean }) =>
					s.season === currentSeason && s.playoffs === false,
			);
			return {
				pid: p.pid,
				name: `${p.firstName} ${p.lastName}`,
				tid: p.tid,
				teamName: tidToName[p.tid] ?? "",
				position: latestRatings?.pos ?? "",
				seasonAverages: {
					pts: seasonStats?.pts ?? 0,
					reb: seasonStats?.trb ?? 0,
					ast: seasonStats?.ast ?? 0,
				},
			};
		})
		.slice(0, 20);

	// ── recentGames — last 5 completed games sorted by gid desc ──
	const recentGames: GameResult[] = allGames
		.sort((a, b) => b.gid - a.gid)
		.slice(0, 5)
		.map((game) => {
			const homeTeam = game.teams[0];
			const awayTeam = game.teams[1];
			return {
				gid: game.gid,
				homeName: tidToName[homeTeam?.tid] ?? "",
				awayName: tidToName[awayTeam?.tid] ?? "",
				homeScore: homeTeam?.pts ?? 0,
				awayScore: awayTeam?.pts ?? 0,
				date: String(game.season),
			};
		});

	// ── transactions — last 10 matching events from current season ──
	const relevantTypes = new Set(["trade", "freeAgent", "release", "injured"]);

	const typeMap: Record<string, TransactionSummary["type"]> = {
		trade: "trade",
		freeAgent: "signing",
		release: "release",
		injured: "injury",
	};

	const transactions: TransactionSummary[] = allEvents
		.filter((ev) => relevantTypes.has(ev.type) && ev.season === currentSeason)
		.sort((a, b) => b.eid - a.eid)
		.slice(0, 10)
		.map((ev) => ({
			type: typeMap[ev.type] ?? "signing",
			description: ev.text ?? "",
			timestamp: Date.now(),
		}));

	// ── liveGame — from arg only, no IDB ──
	const liveGame = liveStats
		? {
				score: liveStats.score,
				quarter: liveStats.quarter,
				statLeaders: liveStats.statLeaders,
			}
		: undefined;

	return {
		...(liveGame !== undefined ? { liveGame } : {}),
		teams,
		players,
		recentGames,
		standings,
		transactions,
	};
}

export default getSocialContext;
