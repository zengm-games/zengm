import { bySport } from "../../common/sportFunctions.ts";
import { LiveGamePlaybackBaseball } from "./LiveGamePlayback.baseball.tsx";
import { LiveGamePlaybackBasketball } from "./LiveGamePlayback.basketball.tsx";
import { LiveGamePlaybackFootball } from "./LiveGamePlayback.football.tsx";
import { LiveGamePlaybackHockey } from "./LiveGamePlayback.hockey.tsx";

export type LiveGamePlayback =
	| LiveGamePlaybackBaseball
	| LiveGamePlaybackBasketball
	| LiveGamePlaybackFootball
	| LiveGamePlaybackHockey;

// The box score and events come untyped from the worker. Each sport's class has its own types for them.
export const LiveGamePlayback = bySport<
	new (boxScore: any, events: any[]) => LiveGamePlayback
>({
	baseball: LiveGamePlaybackBaseball,
	basketball: LiveGamePlaybackBasketball,
	football: LiveGamePlaybackFootball,
	hockey: LiveGamePlaybackHockey,
});
