import { MergedStore } from "./engine.ts";

// Each of these is like the same store in idb.cache or idb.league, except it merges the data in both. If a row is in both, the cache version is used. Rows from the cache are not copied, so don't mutate them.
export const allStars = new MergedStore("allStars", {
	currentSeasonInCache: true,
});
export const awards = new MergedStore("awards");
export const draftLotteryResults = new MergedStore("draftLotteryResults");
export { default as draftPicks } from "./draftPicks.ts";
export { default as events } from "./events.ts";
export { default as games } from "./games.ts";
export const headToHeads = new MergedStore("headToHeads", {
	currentSeasonInCache: true,
});
export { default as messages } from "./messages.ts";
export const playerFeats = new MergedStore("playerFeats");
export { default as players } from "./players.ts";
export const playoffSeries = new MergedStore("playoffSeries", {
	currentSeasonInCache: true,
});
export const scheduledEvents = new MergedStore("scheduledEvents");
export { default as teamSeasons } from "./teamSeasons.ts";
export { default as teamStats } from "./teamStats.ts";
