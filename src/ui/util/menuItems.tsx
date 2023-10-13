import { takeScreenshot, toWorker } from ".";
import {
	bySport,
	DAILY_SCHEDULE,
	DEPTH_CHART_NAME,
	isSport,
	SPORT_HAS_REAL_PLAYERS,
	WEBSITE_ROOT,
} from "../../common";
import type { MenuItemLink, MenuItemHeader } from "../../common/types";
import { frivolities } from "../views/Frivolities";

const depthChart: MenuItemLink[] =
	DEPTH_CHART_NAME !== undefined
		? [
				{
					type: "link",
					active: (pageID, pathname) =>
						pageID === "depth" &&
						(!isSport("baseball") ||
							!pathname ||
							(!pathname.includes("/D") && !pathname.includes("/P"))),
					league: true,
					commandPalette: true,
					path: ["depth"],
					text: DEPTH_CHART_NAME,
				},
		  ]
		: [];

if (isSport("baseball")) {
	depthChart.push(
		{
			type: "link",
			active: (pageID, pathname) =>
				pageID === "depth" && !!pathname && pathname.includes("/D"),
			league: true,
			commandPalette: true,
			path: ["depth", "D"],
			text: "Defense",
		},
		{
			type: "link",
			active: (pageID, pathname) =>
				pageID === "depth" && !!pathname && pathname.includes("/P"),
			league: true,
			commandPalette: true,
			path: ["depth", "P"],
			text: "Pitching",
		},
	);
}

const scheduledEvents: MenuItemLink = {
	type: "link",
	active: pageID => pageID === "scheduledEvents",
	league: true,
	commandPalette: true,
	path: ["scheduled_events"],
	text: "Scheduled Events",
};

const menuItems: (MenuItemLink | MenuItemHeader)[] = [
	{
		type: "link",
		active: pageID => pageID === "dashboard",
		nonLeague: true,
		commandPalette: true,
		path: "/",
		text: "Leagues",
	},
	...(SPORT_HAS_REAL_PLAYERS
		? ([
				{
					type: "link",
					active: pageID => pageID === "newLeague",
					nonLeague: true,
					path: "/new_league",
					text: "New League",
				},
				{
					type: "link",
					nonLeague: true,
					commandPalette: true,
					commandPaletteOnly: true,
					path: "/new_league/real",
					text: "New League > Real Players",
				},
				{
					type: "link",
					nonLeague: true,
					commandPalette: true,
					commandPaletteOnly: true,
					path: "/new_league/random",
					text: "New League > Random Players",
				},
				{
					type: "link",
					nonLeague: true,
					commandPalette: true,
					commandPaletteOnly: true,
					path: "/new_league/legends",
					text: "New League > Legends",
				},
				{
					type: "link",
					nonLeague: true,
					commandPalette: true,
					commandPaletteOnly: true,
					path: "/new_league",
					text: "New League > Custom",
				},
		  ] as MenuItemLink[])
		: ([
				{
					type: "link",
					active: pageID => pageID === "newLeague",
					nonLeague: true,
					commandPalette: true,
					path: "/new_league",
					text: "New League",
				},
		  ] as MenuItemLink[])),
	{
		type: "link",
		active: pageID =>
			typeof pageID === "string" && pageID.startsWith("exhibition"),
		nonLeague: true,
		commandPalette: true,
		path: "/exhibition",
		text: "Exhibition Game",
	},
	{
		type: "link",
		active: pageID => pageID === "dashboard",
		league: true,
		path: "/",
		text: "Switch League",
	},
	{
		type: "link",
		active: pageID => pageID === "leagueDashboard",
		league: true,
		path: [],
		text: {
			side: "Dashboard",
			top: (
				<>
					<span className="glyphicon glyphicon-home" />
					<span className="visually-hidden">League Dashboard</span>
				</>
			),
		},
	},
	{
		type: "header",
		long: "League",
		short: "L",
		league: true,
		commandPalette: true,
		children: [
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: [],
				text: "Dashboard",
			},
			{
				type: "link",
				active: pageID => pageID === "standings",
				league: true,
				commandPalette: true,
				path: ["standings"],
				text: "Standings",
			},
			{
				type: "link",
				active: pageID => pageID === "playoffs",
				league: true,
				commandPalette: true,
				path: ["playoffs"],
				text: "Playoffs",
			},
			{
				type: "link",
				active: pageID => pageID === "dailySchedule",
				league: true,
				commandPalette: true,
				path: ["daily_schedule"],
				text: DAILY_SCHEDULE,
			},
			{
				type: "link",
				active: pageID => pageID === "leagueFinances",
				league: true,
				commandPalette: true,
				path: ["league_finances"],
				text: "Finances",
			},
			{
				type: "link",
				active: pageID => pageID === "history" || pageID === "historyAll",
				league: true,
				commandPalette: true,
				path: ["history_all"],
				text: "History",
			},
			{
				type: "link",
				active: pageID => pageID === "powerRankings",
				league: true,
				commandPalette: true,
				path: ["power_rankings"],
				text: "Power Rankings",
			},
			{
				type: "link",
				active: pageID => pageID === "transactions",
				league: true,
				commandPalette: true,
				path: ["transactions", "all"],
				text: "Transactions",
			},
			{
				type: "link",
				active: pageID => pageID === "news",
				league: true,
				commandPalette: true,
				path: ["news"],
				text: "News Feed",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["head2head_all"],
				text: "Head-to-Head",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["team_records"],
				text: "Team Records",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["awards_records"],
				text: "Awards Records",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["all_star", "history"],
				text: "All-Star History",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["season_preview"],
				text: "Season Previews",
			},
		],
	},
	{
		type: "header",
		long: "Team",
		short: "T",
		league: true,
		commandPalette: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "roster",
				league: true,
				commandPalette: true,
				path: ["roster"],
				text: "Roster",
			},
			...(bySport({
				baseball: true,
				basketball: false,
				football: true,
				hockey: true,
			})
				? depthChart
				: []),
			{
				type: "link",
				active: pageID => pageID === "schedule",
				league: true,
				commandPalette: true,
				path: ["schedule"],
				text: "Schedule",
			},
			{
				type: "link",
				active: pageID => pageID === "teamFinances",
				league: true,
				commandPalette: true,
				path: ["team_finances"],
				text: "Finances",
			},
			{
				type: "link",
				active: pageID => pageID === "teamHistory",
				league: true,
				commandPalette: true,
				path: ["team_history"],
				text: "History",
			},
			{
				type: "link",
				active: pageID => pageID === "gmHistory",
				league: true,
				commandPalette: true,
				path: ["gm_history"],
				text: "GM History",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["head2head"],
				text: "Head-to-Head",
			},
		],
	},
	{
		type: "header",
		long: "Players",
		short: "P",
		league: true,
		commandPalette: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "freeAgents",
				league: true,
				commandPalette: true,
				path: ["free_agents"],
				text: "Free Agents",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["upcoming_free_agents"],
				text: "Upcoming Free Agents",
			},
			{
				type: "link",
				active: pageID => pageID === "trade",
				league: true,
				commandPalette: true,
				path: ["trade"],
				text: "Trade",
			},
			{
				type: "link",
				active: pageID => pageID === "tradingBlock",
				league: true,
				commandPalette: true,
				path: ["trading_block"],
				text: "Trading Block",
			},
			{
				type: "link",
				active: pageID => pageID === "tradeProposals",
				league: true,
				commandPalette: true,
				path: ["trade_proposals"],
				text: "Trade Proposals",
			},
			{
				type: "link",
				active: pageID =>
					typeof pageID === "string" && pageID.startsWith("draft"),
				league: true,
				commandPalette: true,
				path: ["draft"],
				text: "Draft",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["draft_scouting"],
				text: "Draft Scouting",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["draft_lottery"],
				text: "Draft Lottery",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["draft_history"],
				text: "Draft History",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["draft_team_history"],
				text: "Draft Team History",
			},
			{
				type: "link",
				active: pageID => pageID === "watchList",
				league: true,
				commandPalette: true,
				path: ["watch_list"],
				text: "Watch List",
			},
			{
				type: "link",
				active: pageID => pageID === "hallOfFame",
				league: true,
				commandPalette: true,
				path: ["hall_of_fame"],
				text: "Hall of Fame",
			},
		],
	},
	{
		type: "header",
		long: "Stats",
		short: "S",
		league: true,
		commandPalette: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "gameLog",
				league: true,
				commandPalette: true,
				path: ["game_log"],
				text: "Game Log",
			},
			{
				type: "link",
				active: pageID =>
					pageID === "leaders" ||
					pageID === "leadersProgressive" ||
					pageID === "leadersYears",
				league: true,
				commandPalette: true,
				path: ["leaders"],
				text: "League Leaders",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["leaders_progressive"],
				text: "Progressive Leaders",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["leaders_years"],
				text: "Yearly Leaders",
			},
			{
				type: "link",
				active: pageID => pageID === "playerRatings",
				league: true,
				commandPalette: true,
				path: ["player_ratings"],
				text: "Player Ratings",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["player_rating_dists"],
				text: "Player Rating Distributions",
			},
			{
				type: "link",
				active: pageID => pageID === "playerStats",
				league: true,
				commandPalette: true,
				path: ["player_stats"],
				text: "Player Stats",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["player_stat_dists"],
				text: "Player Stat Distributions",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: [
					"player_stats",
					"all",
					"career",
					bySport({
						baseball: "batting",
						basketball: "totals",
						football: "passing",
						hockey: "skater",
					}),
				],
				text: "Career Totals",
			},
			{
				type: "link",
				active: pageID => pageID === "playerBios",
				league: true,
				commandPalette: true,
				path: ["player_bios"],
				text: "Player Bios",
			},
			{
				type: "link",
				active: pageID => pageID === "playerGraphs",
				league: true,
				commandPalette: true,
				path: ["player_graphs"],
				text: "Player Graphs",
			},
			{
				type: "link",
				active: pageID => pageID === "teamStats",
				league: true,
				commandPalette: true,
				path: ["team_stats"],
				text: "Team Stats",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: ["team_stat_dists"],
				text: "Team Stat Distributions",
			},
			{
				type: "link",
				active: pageID => pageID === "leagueStats",
				league: true,
				commandPalette: true,
				path: ["league_stats"],
				text: "League Stats",
			},
			{
				type: "link",
				active: pageID => pageID === "injuries",
				league: true,
				commandPalette: true,
				path: ["injuries"],
				text: "Injuries",
			},
			{
				type: "link",
				active: pageID => pageID === "playerFeats",
				league: true,
				commandPalette: true,
				path: ["player_feats"],
				text: "Statistical Feats",
			},
			{
				type: "link",
				active: pageID => pageID === "awardRaces",
				league: true,
				commandPalette: true,
				path: ["award_races"],
				text: "Award Races",
			},
		],
	},
	{
		type: "header",
		long: "Tools",
		short: "X",
		league: true,
		nonLeague: true,
		commandPalette: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "achievements",
				league: true,
				nonLeague: true,
				commandPalette: true,
				path: "/achievements",
				text: "Achievements",
			},
			{
				type: "link",
				league: true,
				commandPalette: true,

				async onClick() {
					const response = await toWorker(
						"toolsMenu",
						"autoPlaySeasons",
						undefined,
					);
					return response;
				},

				text: "Auto Play",
			},
			{
				type: "link",
				active: pageID => pageID === "customizePlayer",
				godMode: true,
				league: true,
				commandPalette: true,
				path: ["customize_player"],
				text: "Create A Player",
			},
			{
				type: "link",
				active: pageID => pageID === "deleteOldData",
				league: true,
				commandPalette: true,
				path: ["delete_old_data"],
				text: "Delete Old Data",
			},
			{
				type: "link",
				active: pageID => pageID === "editAwards",
				godMode: true,
				league: true,
				commandPalette: true,
				path: ["edit_awards"],
				text: "Edit Awards",
			},
			{
				type: "link",
				active: pageID => pageID === "playerRatingsOverride",
				godMode: true,
				league: true,
				commandPalette: true,
				path: ["player_ratings_override"],
				text: "Player Ratings Override",
			},
			{
				type: "link",
				active: pageID => pageID === "exportLeague",
				league: true,
				commandPalette: true,
				path: ["export_league"],
				text: "Export League",
			},
			{
				type: "link",
				active: pageID => pageID === "exportStats",
				league: true,
				commandPalette: true,
				path: ["export_stats"],
				text: "Export Stats",
			},
			{
				type: "link",
				active: pageID => pageID === "expansionDraft",
				league: true,
				commandPalette: true,
				path: ["expansion_draft"],
				text: "Expansion Draft",
			},
			{
				type: "link",
				active: pageID => pageID === "fantasyDraft",
				league: true,
				commandPalette: true,
				path: ["fantasy_draft"],
				text: "Fantasy Draft",
			},
			{
				type: "link",
				active: pageID => pageID === "frivolities",
				league: true,
				commandPalette: true,
				path: ["frivolities"],
				text: "Frivolities",
			},
			{
				type: "link",
				active: pageID => pageID === "godMode",
				league: true,
				commandPalette: true,
				path: ["god_mode"],
				text: "God Mode",
			},
			{
				type: "link",
				active: pageID => pageID === "exportPlayers",
				league: true,
				commandPalette: true,
				path: ["export_players"],
				text: "Import/Export Players",
			},
			{
				type: "link",
				active: pageID => pageID === "manageConfs",
				league: true,
				commandPalette: true,
				path: ["manage_confs"],
				text: "Manage Confs",
			},
			{
				type: "link",
				active: pageID => pageID === "manageTeams",
				league: true,
				commandPalette: true,
				path: ["manage_teams"],
				text: "Manage Teams",
			},
			{
				type: "link",
				active: pageID => pageID === "multiTeamMode",
				league: true,
				commandPalette: true,
				godMode: true,
				path: ["multi_team_mode"],
				text: "Multi Team Mode",
			},
			{
				type: "link",
				active: pageID => pageID === "newTeam",
				league: true,
				commandPalette: true,
				godMode: true,
				path: ["new_team"],
				text: "Switch Team",
			},
			...(isSport("basketball") ? [scheduledEvents] : []),
			{
				type: "link",
				league: true,
				nonLeague: true,
				commandPalette: true,

				onClick() {
					takeScreenshot();
				},

				text: (
					<span>
						<span className="glyphicon glyphicon-camera" /> Screenshot
					</span>
				),
			},
			{
				type: "link",
				nonLeague: true,
				commandPalette: true,

				async onClick(): Promise<false> {
					const response = await toWorker("toolsMenu", "resetDb", undefined);

					if (response) {
						window.location.reload();
					}

					return false;
				},

				text: "Delete All Leagues",
			},
			{
				type: "link",
				active: pageID =>
					pageID === "globalSettings" || pageID === "defaultNewLeagueSettings",
				league: true,
				nonLeague: true,
				commandPalette: true,
				path: "/settings",
				text: "Global Settings",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				commandPalette: true,
				commandPaletteOnly: true,
				path: "/settings/default",
				text: "Default New League Settings",
			},
			{
				type: "link",
				active: pageID => pageID === "settings",
				league: true,
				commandPalette: true,
				path: ["settings"],
				text: "League Settings",
			},
			{
				type: "link",
				active: pageID => pageID === "dangerZone",
				league: true,
				commandPalette: true,
				path: ["danger_zone"],
				text: "Danger Zone",
			},
		],
	},
	{
		type: "header",
		long: "Frivolities",
		short: "F",
		league: true,
		commandPalette: true,
		commandPaletteOnly: true,
		children: Object.entries(frivolities)
			.map(([category, rows]) =>
				rows.map(
					row =>
						({
							type: "link",
							league: true,
							commandPalette: true,
							commandPaletteOnly: true,
							path: ["frivolities", ...row.urlParts],
							text: `${category} > ${row.name}`,
						} as MenuItemLink),
				),
			)
			.flat(),
	},
	{
		type: "header",
		long: "Help",
		short: "?",
		league: true,
		nonLeague: true,
		commandPalette: true,
		children: [
			{
				type: "link",
				league: true,
				nonLeague: true,
				commandPalette: true,
				path: `https://${WEBSITE_ROOT}/manual/`,
				text: "Manual",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				commandPalette: true,
				path: `https://${WEBSITE_ROOT}/manual/customization/`,
				text: "Custom Rosters",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				commandPalette: true,
				path: `https://${WEBSITE_ROOT}/manual/debugging/`,
				text: "Debugging",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				commandPalette: true,
				path: "https://zengm.com/changelog/",
				text: "Changelog",
			},
		],
	},
];

export default menuItems;
