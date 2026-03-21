import { useEffect, useRef, useState } from "react";
import { toWorker } from "../util/index.ts";
import type { PodcastRecord } from "../../common/types.ts";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 120_000; // give up after 2 minutes

type Props = {
	gid: number;
};

const GamePodcast = ({ gid }: Props) => {
	const [podcast, setPodcast] = useState<PodcastRecord | null | "loading">(
		"loading",
	);
	const audioUrlRef = useRef<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;
		const startedAt = Date.now();

		const poll = async () => {
			if (cancelled) {
				return;
			}

			const result = await toWorker("main", "getPodcast", { gid });

			if (cancelled) {
				return;
			}

			if (result) {
				setPodcast(result);
				return;
			}

			// Still not ready — keep polling unless timed out
			if (Date.now() - startedAt < POLL_TIMEOUT_MS) {
				timer = setTimeout(poll, POLL_INTERVAL_MS);
			} else {
				setPodcast(null); // gave up
			}
		};

		poll();

		return () => {
			cancelled = true;
			if (timer !== null) {
				clearTimeout(timer);
			}
			if (audioUrlRef.current) {
				URL.revokeObjectURL(audioUrlRef.current);
				audioUrlRef.current = null;
			}
		};
	}, [gid]);

	if (podcast === "loading") {
		return (
			<div className="mt-3 text-muted" style={{ fontSize: "0.875rem" }}>
				<span
					className="spinner-border spinner-border-sm me-2"
					role="status"
					aria-hidden="true"
				/>
				Generating Inside the NBA podcast…
			</div>
		);
	}

	if (!podcast) {
		return null;
	}

	// Convert base64 to blob URL once
	if (!audioUrlRef.current) {
		const byteChars = atob(podcast.audioData);
		const byteNums = new Uint8Array(byteChars.length);
		for (let i = 0; i < byteChars.length; i++) {
			byteNums[i] = byteChars.charCodeAt(i);
		}
		const blob = new Blob([byteNums], { type: podcast.mimeType });
		audioUrlRef.current = URL.createObjectURL(blob);
	}

	const { homeTeam, awayTeam, homeScore, awayScore } = podcast.gameInfo;
	const winner = homeScore > awayScore ? homeTeam : awayTeam;

	return (
		<div className="mt-3">
			<div
				className="d-flex align-items-center gap-2 mb-1"
				style={{ fontSize: "0.8rem", color: "#aaa" }}
			>
				<span>🎙</span>
				<strong>Inside the NBA</strong>
				<span className="text-muted">— {winner} recap</span>
			</div>
			<audio
				controls
				src={audioUrlRef.current}
				style={{ width: "100%", maxWidth: 420 }}
			/>
		</div>
	);
};

export default GamePodcast;
