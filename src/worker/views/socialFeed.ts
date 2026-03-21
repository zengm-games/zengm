import { formatEventText, g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import type { FaceConfig } from "facesjs";

const updateSocialFeed = async (
	{ season }: ViewInput<"socialFeed">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		state.season !== season
	) {
		// Fetch game events
		const eventsAll = await idb.getCopies.events({ season });
		eventsAll.reverse(); // Newest first

		// Filter to interesting events and limit
		const filteredEvents = eventsAll
			.filter(
				(e) =>
					!["retiredList", "newTeam"].includes(e.type) &&
					(e.score === undefined || e.score >= 10),
			)
			.slice(0, 50);

		// Build posts from events
		const posts = [];
		for (const event of filteredEvents) {
			let authorFace: FaceConfig | undefined;
			let authorImgURL: string | undefined;
			let authorName = "GGM Basketball";
			let authorTeamAbbrev = "GGM";

			// Try to get player info for the first associated player
			if (event.pids && event.pids.length > 0) {
				const player = await idb.getCopy.players(
					{ pid: event.pids[0] },
					"noCopyCache",
				);
				if (player) {
					authorName = `${player.firstName} ${player.lastName}`;
					authorFace = player.imgURL ? undefined : player.face;
					authorImgURL = player.imgURL;
				}
			}

			// Try to get team info
			if (event.tids && event.tids.length > 0 && event.tids[0]! >= 0) {
				const teamInfoCache = g.get("teamInfoCache");
				const teamInfo = teamInfoCache[event.tids[0]!];
				if (teamInfo) {
					authorTeamAbbrev = teamInfo.abbrev;
				}
			}

			posts.push({
				eid: event.eid,
				type: event.type,
				text: await formatEventText(event),
				pids: event.pids,
				tids: event.tids,
				season: event.season,
				score: event.score,
				authorName,
				authorTeamAbbrev,
				authorFace,
				authorImgURL,
			});
		}

		// Get teams for display
		const teams = (
			await idb.getCopies.teamsPlus(
				{
					seasonAttrs: [
						"abbrev",
						"colors",
						"imgURL",
						"imgURLSmall",
						"region",
						"name",
					],
					season,
					addDummySeason: true,
				},
				"noCopyCache",
			)
		).map((t) => t.seasonAttrs);

		// Get messages (inbox) for notifications-like display
		const messages = await idb.getCopies.messages({ limit: 20 });
		messages.reverse();

		return {
			events: posts,
			messages,
			season,
			teams,
			userTid: g.get("userTid"),
		};
	}
};

export default updateSocialFeed;
