import { makeStore } from "./engine.ts";

// Each of these is like the same store in idb.cache or idb.league, except it merges the data in both. If a row is in both, the cache version is used. Rows are not copied by default, so don't mutate them unless you pass the copy option.
export const allStars = makeStore("allStars");
export const awards = makeStore("awards");
export const draftLotteryResults = makeStore("draftLotteryResults");
export { default as draftPicks } from "./draftPicks.ts";
export { default as events } from "./events.ts";
export { default as games } from "./games.ts";
export const headToHeads = makeStore("headToHeads");
export { default as messages } from "./messages.ts";
export const playerFeats = makeStore("playerFeats");
export { default as players } from "./players.ts";
export { default as playoffSeries } from "./playoffSeries.ts";
export const scheduledEvents = makeStore("scheduledEvents");
export { default as teamSeasons } from "./teamSeasons.ts";
