import type { FaceConfig } from "facesjs";
import type { LogEventType } from "../../../common/types.ts";

export interface SocialEvent {
	eid: number;
	type: LogEventType;
	text: string;
	pids?: number[];
	tids?: number[];
	season: number;
	score?: number;
	authorName: string;
	authorTeamAbbrev: string;
	authorFace?: FaceConfig;
	authorImgURL?: string;
}

export interface SocialTeam {
	abbrev: string;
	colors: [string, string, string];
	imgURL?: string;
	imgURLSmall?: string;
	region: string;
	name: string;
}

export interface SocialMessage {
	mid: number;
	from: string;
	read: boolean;
	text: string;
	year: number;
	subject?: string;
}
