import type { GameAttributesLeague } from "./types.ts";

// Exhibition games have no conferences, so a DH setting that applies only to some conferences never applies
export const exhibitionHasDh = (dh: GameAttributesLeague["dh"]) => dh === "all";
