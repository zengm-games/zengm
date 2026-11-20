import { bySport } from "../../common/sportFunctions.ts";
import {
	LiveGamePlaybackBaseball,
	type SportState as SportStateBaseball,
} from "./LiveGamePlayback.baseball.tsx";
import { LiveGamePlaybackBasketball } from "./LiveGamePlayback.basketball.tsx";
import { LiveGamePlaybackFootball } from "./LiveGamePlayback.football.tsx";
import { LiveGamePlaybackHockey } from "./LiveGamePlayback.hockey.tsx";

export type LiveGamePlayback =
	| LiveGamePlaybackBaseball
	| LiveGamePlaybackBasketball
	| LiveGamePlaybackFootball
	| LiveGamePlaybackHockey;

export type LiveGameSportState = LiveGamePlayback["sportState"];

// Only baseball tracks outs
export const isSportStateBaseball = (
	sportState: LiveGameSportState,
): sportState is SportStateBaseball =>
	sportState !== undefined && "outs" in sportState;

// The box score and events come untyped from the worker. Each sport's class has its own types for them.
export const LiveGamePlayback = bySport<
	new (boxScore: any, events: any[]) => LiveGamePlayback
>({
	baseball: LiveGamePlaybackBaseball,
	basketball: LiveGamePlaybackBasketball,
	football: LiveGamePlaybackFootball,
	hockey: LiveGamePlaybackHockey,
});
