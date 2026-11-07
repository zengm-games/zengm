import g from "./g.ts";
import local from "./local.ts";

// Whether the user is making decisions for this team right now, rather than the AI. During auto play or spectator mode, the AI controls every team.
export const userControlsTeam = (tid: number) =>
	g.get("userTids").includes(tid) &&
	!local.autoPlayUntil &&
	!g.get("spectator");
