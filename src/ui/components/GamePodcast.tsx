import { useEffect, useRef, useState } from "react";
import { toWorker } from "../util/index.ts";
import type { PodcastRecord } from "../../common/types.ts";

type Props = {
	gid: number;
	boxScore: any;
};

type PodcastState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "ready"; podcast: PodcastRecord }
	| { status: "error"; message: string };

const buildPodcastInput = (gid: number, boxScore: any) => {
	const teams = boxScore.teams ?? [];
	const home = teams[0];
	const away = teams[1];

	const mapPlayers = (players: any[]) =>
		(players ?? [])
			.filter((p: any) => (p.min ?? p.minutes ?? 0) > 0)
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
				min: Math.round(p.min ?? p.minutes ?? 0),
			}));

	return {
		gid,
		season: boxScore.season ?? 0,
		playoffs: boxScore.playoffs ?? false,
		homeTeam: home ? `${home.region ?? ""} ${home.name ?? ""}`.trim() : "Home",
		awayTeam: away ? `${away.region ?? ""} ${away.name ?? ""}`.trim() : "Away",
		homeScore: home?.pts ?? 0,
		awayScore: away?.pts ?? 0,
		overtimes: boxScore.overtimes ?? 0,
		homePlayers: mapPlayers(home?.players ?? []),
		awayPlayers: mapPlayers(away?.players ?? []),
		homeRecord: `${home?.won ?? 0}-${home?.lost ?? 0}`,
		awayRecord: `${away?.won ?? 0}-${away?.lost ?? 0}`,
	};
};

const GamePodcast = ({ gid, boxScore }: Props) => {
	const [state, setState] = useState<PodcastState>({ status: "loading" });
	const audioUrlRef = useRef<string | null>(null);

	// Check IDB for existing podcast on mount
	useEffect(() => {
		let cancelled = false;
		toWorker("main", "getPodcast", { gid }).then((result) => {
			if (cancelled) return;
			if (result) {
				setState({ status: "ready", podcast: result });
			} else {
				setState({ status: "idle" });
			}
		});
		return () => {
			cancelled = true;
			if (audioUrlRef.current) {
				URL.revokeObjectURL(audioUrlRef.current);
				audioUrlRef.current = null;
			}
		};
	}, [gid]);

	const generate = async () => {
		setState({ status: "loading" });
		try {
			const input = buildPodcastInput(gid, boxScore);
			const res = await fetch("/api/podcast", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!res.ok) {
				const text = await res.text();
				setState({
					status: "error",
					message: `API error ${res.status}: ${text}`,
				});
				return;
			}

			const { audioData, mimeType } = await res.json();

			const podcast: PodcastRecord = {
				gid,
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
			};

			await toWorker("main", "storePodcast", podcast);
			setState({ status: "ready", podcast });
		} catch (err: any) {
			setState({ status: "error", message: err?.message ?? String(err) });
		}
	};

	if (state.status === "loading") {
		return (
			<div className="mt-3">
				<button className="btn btn-danger btn-lg" disabled>
					<span className="spinner-border spinner-border-sm me-2" />
					Generating podcast…
				</button>
			</div>
		);
	}

	if (state.status === "error") {
		return (
			<div className="mt-3">
				<button className="btn btn-danger btn-lg" onClick={generate}>
					🎙 Generate Podcast
				</button>
				<div className="text-danger mt-1" style={{ fontSize: "0.8rem" }}>
					{state.message}
				</div>
			</div>
		);
	}

	if (state.status === "idle") {
		return (
			<div className="mt-3">
				<button className="btn btn-danger btn-lg" onClick={generate}>
					🎙 Generate Podcast
				</button>
			</div>
		);
	}

	// ready
	const podcast = state.podcast;
	if (!audioUrlRef.current) {
		const byteChars = atob(podcast.audioData);
		const byteNums = new Uint8Array(byteChars.length);
		for (let i = 0; i < byteChars.length; i++) {
			byteNums[i] = byteChars.charCodeAt(i);
		}
		const blob = new Blob([byteNums], { type: podcast.mimeType });
		audioUrlRef.current = URL.createObjectURL(blob);
	}

	return (
		<div className="mt-3">
			<div
				className="d-flex align-items-center gap-2 mb-1"
				style={{ fontSize: "0.8rem", color: "#aaa" }}
			>
				<strong>🎙 Inside the NBA</strong>
				<span className="text-muted">
					— {podcast.gameInfo.homeTeam} vs {podcast.gameInfo.awayTeam}
				</span>
			</div>
			<audio
				controls
				src={audioUrlRef.current}
				style={{ width: "100%", maxWidth: 480 }}
			/>
		</div>
	);
};

export default GamePodcast;
