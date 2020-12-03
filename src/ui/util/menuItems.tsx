import * as React from "react";
import { takeScreenshot, toWorker } from ".";
import type { MenuItemLink, MenuItemHeader } from "../../common/types";

const depthChart: MenuItemLink = {
	type: "link",
	active: pageID => pageID === "depthFootball",
	league: true,
	path: ["depth"],
	text: "Depth Chart",
};

const scheduledEvents: MenuItemLink = {
	type: "link",
	active: pageID => pageID === "scheduledEvents",
	league: true,
	path: ["scheduled_events"],
	text: "Scheduled Events",
};

const menuItems: (MenuItemLink | MenuItemHeader)[] = [
	{
		type: "link",
		active: pageID => pageID === "dashboard",
		nonLeague: true,
		path: "/",
		text: "Leagues",
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
					<span className="sr-only">League Dashboard</span>
				</>
			),
		},
	},
	{
		type: "header",
		long: "League",
		short: "L",
		league: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "standings",
				league: true,
				path: ["standings"],
				text: "Standings",
			},
			{
				type: "link",
				active: pageID => pageID === "playoffs",
				league: true,
				path: ["playoffs"],
				text: "Playoffs",
			},
			{
				type: "link",
				active: pageID => pageID === "leagueFinances",
				league: true,
				path: ["league_finances"],
				text: "Finances",
			},
			{
				type: "link",
				active: pageID => pageID === "history" || pageID === "historyAll",
				league: true,
				path: ["history_all"],
				text: "History",
			},
			{
				type: "link",
				active: pageID => pageID === "powerRankings",
				league: true,
				path: ["power_rankings"],
				text: "Power Rankings",
			},
			{
				type: "link",
				active: pageID => pageID === "transactions",
				league: true,
				path: ["transactions", "all"],
				text: "Transactions",
			},
			{
				type: "link",
				active: pageID => pageID === "news",
				league: true,
				path: ["news"],
				text: "News Feed",
			},
		],
	},
	{
		type: "header",
		long: "Team",
		short: "T",
		league: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "roster",
				league: true,
				path: ["roster"],
				text: "Roster",
			},
			...(process.env.SPORT === "football" ? [depthChart] : []),
			{
				type: "link",
				active: pageID => pageID === "schedule",
				league: true,
				path: ["schedule"],
				text: "Schedule",
			},
			{
				type: "link",
				active: pageID => pageID === "teamFinances",
				league: true,
				path: ["team_finances"],
				text: "Finances",
			},
			{
				type: "link",
				active: pageID => pageID === "teamHistory",
				league: true,
				path: ["team_history"],
				text: "History",
			},
			{
				type: "link",
				active: pageID => pageID === "gmHistory",
				league: true,
				path: ["gm_history"],
				text: "GM History",
			},
		],
	},
	{
		type: "header",
		long: "Players",
		short: "P",
		league: true,
		children: [
			{
				type: "link",
				active: pageID => pageID === "freeAgents",
				league: true,
				path: ["free_agents"],
				text: "Free Agents",
			},
			{
				type: "link",
				active: pageID => pageID === "trade",
				league: true,
				path: ["trade"],
				text: "Trade",
			},
			{
				type: "link",
				active: pageID => pageID === "tradingBlock",
				league: true,
				path: ["trading_block"],
				text: "Trading Block",
			},
			{
				type: "link",
				active: pageID =>
					typeof pageID === "string" && pageID.startsWith("draft"),
				league: true,
				path: ["draft"],
				text: "Draft",
			},
			{
				type: "link",
				active: pageID => pageID === "watchList",
				league: true,
				path: ["watch_list"],
				text: "Watch List",
			},
			{
				type: "link",
				active: pageID => pageID === "hallOfFame",
				league: true,
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
		children: [
			{
				type: "link",
				active: pageID => pageID === "gameLog",
				league: true,
				path: ["game_log"],
				text: "Game Log",
			},
			{
				type: "link",
				active: pageID => pageID === "leaders",
				league: true,
				path: ["leaders"],
				text: "League Leaders",
			},
			{
				type: "link",
				active: pageID => pageID === "playerBios",
				league: true,
				path: ["player_bios"],
				text: "Player Bios",
			},
			{
				type: "link",
				active: pageID => pageID === "playerRatings",
				league: true,
				path: ["player_ratings"],
				text: "Player Ratings",
			},
			{
				type: "link",
				active: pageID => pageID === "playerStats",
				league: true,
				path: ["player_stats"],
				text: "Player Stats",
			},
			{
				type: "link",
				active: pageID => pageID === "teamStats",
				league: true,
				path: ["team_stats"],
				text: "Team Stats",
			},
			{
				type: "link",
				active: pageID => pageID === "leagueStats",
				league: true,
				path: ["league_stats"],
				text: "League Stats",
			},
			{
				type: "link",
				active: pageID => pageID === "playerFeats",
				league: true,
				path: ["player_feats"],
				text: "Statistical Feats",
			},
			{
				type: "link",
				active: pageID => pageID === "awardRaces",
				league: true,
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
		children: [
			{
				type: "link",
				active: pageID => pageID === "account",
				league: true,
				nonLeague: true,
				path: "/account",
				text: "Achievements",
			},
			{
				type: "link",
				league: true,

				onClick() {
					return toWorker("toolsMenu", "autoPlaySeasons");
				},

				text: "Auto Play",
			},
			{
				type: "link",
				active: pageID => pageID === "customizePlayer",
				godMode: true,
				league: true,
				path: ["customize_player"],
				text: "Create A Player",
			},
			{
				type: "link",
				active: pageID => pageID === "deleteOldData",
				league: true,
				path: ["delete_old_data"],
				text: "Delete Old Data",
			},
			{
				type: "link",
				active: pageID => pageID === "editAwards",
				godMode: true,
				league: true,
				path: ["edit_awards"],
				text: "Edit Awards",
			},
			{
				type: "link",
				active: pageID => pageID === "exportLeague",
				league: true,
				path: ["export_league"],
				text: "Export League",
			},
			{
				type: "link",
				active: pageID => pageID === "exportStats",
				league: true,
				path: ["export_stats"],
				text: "Export Stats",
			},
			{
				type: "link",
				active: pageID => pageID === "expansionDraft",
				league: true,
				path: ["expansion_draft"],
				text: "Expansion Draft",
			},
			{
				type: "link",
				active: pageID => pageID === "fantasyDraft",
				league: true,
				path: ["fantasy_draft"],
				text: "Fantasy Draft",
			},
			{
				type: "link",
				active: pageID => pageID === "frivolities",
				league: true,
				path: ["frivolities"],
				text: "Frivolities",
			},
			{
				type: "link",
				active: pageID => pageID === "godMode",
				league: true,
				path: ["god_mode"],
				text: "God Mode",
			},
			{
				type: "link",
				active: pageID => pageID === "exportPlayers",
				league: true,
				path: ["export_players"],
				text: "Import/Export Players",
			},
			{
				type: "link",
				active: pageID => pageID === "manageConfs",
				league: true,
				path: ["manage_confs"],
				text: "Manage Confs",
			},
			{
				type: "link",
				active: pageID => pageID === "manageTeams",
				league: true,
				path: ["manage_teams"],
				text: "Manage Teams",
			},
			{
				type: "link",
				active: pageID => pageID === "multiTeamMode",
				league: true,
				godMode: true,
				path: ["multi_team_mode"],
				text: "Multi Team Mode",
			},
			{
				type: "link",
				active: pageID => pageID === "newTeam",
				league: true,
				godMode: true,
				path: ["new_team"],
				text: "Switch Team",
			},
			...(process.env.SPORT === "basketball" ? [scheduledEvents] : []),
			{
				type: "link",
				league: true,
				nonLeague: true,

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

				async onClick(): Promise<false> {
					const response = await toWorker("toolsMenu", "resetDb");

					if (response) {
						window.location.reload();
					}

					return false;
				},

				text: "Delete All Leagues",
			},
			{
				type: "link",
				active: pageID => pageID === "options",
				league: true,
				nonLeague: true,
				path: "/settings",
				text: "Global Settings",
			},
			{
				type: "link",
				active: pageID => pageID === "settings",
				league: true,
				path: ["settings"],
				text: "League Settings",
			},
			{
				type: "link",
				active: pageID => pageID === "dangerZone",
				league: true,
				path: ["danger_zone"],
				text: "Danger Zone",
			},
		],
	},
	{
		type: "header",
		long: "Help",
		short: "?",
		league: true,
		nonLeague: true,
		children: [
			{
				type: "link",
				league: true,
				nonLeague: true,
				path: `https://${process.env.SPORT}-gm.com/manual/`,
				text: "Manual",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				path: `https://${process.env.SPORT}-gm.com/manual/customization/`,
				text: "Custom Rosters",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				path: `https://${process.env.SPORT}-gm.com/manual/debugging/`,
				text: "Debugging",
			},
			{
				type: "link",
				league: true,
				nonLeague: true,
				path: "http://basketball-gm.com/changelog/",
				text: "Changelog",
			},
		],
	},
];

export default menuItems;
