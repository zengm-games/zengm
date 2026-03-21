import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import type { Game } from "../../../common/types.ts";
import type { PodcastInput } from "../../../../api/podcast.ts";

const generatePodcast = async (gameStats: Game): Promise<void> => {
	try {
		const teamInfoCache = g.get("teamInfoCache");
		const team0 = gameStats.teams[0];
		const team1 = gameStats.teams[1];

		const homeTeam = teamInfoCache[team0.tid];
		const awayTeam = teamInfoCache[team1.tid];

		if (!homeTeam || !awayTeam) {
			return;
		}

		const mapPlayers = (players: any[]) =>
			players
				.filter((p: any) => p.min > 0)
				.map((p: any) => ({
					name: p.name ?? `Player ${p.pid}`,
					pts: p.pts ?? 0,
					reb: (p.drb ?? 0) + (p.orb ?? 0),
					ast: p.ast ?? 0,
					stl: p.stl ?? 0,
					blk: p.blk ?? 0,
					fg: `${p.fg ?? 0}/${p.fga ?? 0}`,
					tp: `${p.tp ?? 0}/${p.tpa ?? 0}`,
					ft: `${p.ft ?? 0}/${p.fta ?? 0}`,
					min: Math.round(p.min ?? 0),
				}));

		const homeRecord = `${team0.won ?? 0}-${team0.lost ?? 0}`;
		const awayRecord = `${team1.won ?? 0}-${team1.lost ?? 0}`;

		const input: PodcastInput = {
			gid: gameStats.gid,
			season: gameStats.season,
			playoffs: gameStats.playoffs ?? false,
			homeTeam: `${homeTeam.region} ${homeTeam.name}`,
			awayTeam: `${awayTeam.region} ${awayTeam.name}`,
			homeScore: team0.pts,
			awayScore: team1.pts,
			overtimes: gameStats.overtimes,
			homePlayers: mapPlayers(team0.players),
			awayPlayers: mapPlayers(team1.players),
			homeRecord,
			awayRecord,
		};

		const response = await fetch("/api/podcast", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});

		if (!response.ok) {
			console.warn(
				`[podcast] generation failed for gid ${gameStats.gid}: ${response.status}`,
			);
			return;
		}

		const { audioData, mimeType } = (await response.json()) as {
			audioData: string;
			mimeType: string;
		};

		await idb.league.put("podcasts", {
			gid: gameStats.gid,
			audioData,
			mimeType,
			createdAt: Date.now(),
			gameInfo: {
				homeTeam: input.homeTeam,
				awayTeam: input.awayTeam,
				homeScore: input.homeScore,
				awayScore: input.awayScore,
				season: input.season,
				playoffs: input.playoffs,
			},
		});
	} catch (err) {
		// Podcast generation is fire-and-forget — never crash the game
		console.warn("[podcast] error generating podcast:", err);
	}
};

export default generatePodcast;
