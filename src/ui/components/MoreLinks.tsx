import { Fragment } from "react";
import { bySport, isSport, NO_LOTTERY_DRAFT_TYPES } from "../../common";
import type { DraftType } from "../../common/types";
import { helpers, useLocalShallow } from "../util";

const MoreLinks = (
	props: (
		| {
				type: "team";
				abbrev: string;
				tid: number;
				season?: number;
		  }
		| {
				type: "draft";
				draftType: DraftType;
				season?: number;
		  }
		| {
				type: "playerRatings";
				season: number;
		  }
		| {
				type: "playerStats";
				season?: number;
				statType?: string;
		  }
		| {
				type: "teamStats";
				season: number;
		  }
		| {
				type: "freeAgents";
		  }
		| {
				type: "league";
		  }
		| {
				type: "importExport";
		  }
		| {
				type: "awards";
				season?: number;
		  }
		| {
				type: "schedule";
		  }
		| {
				type: "globalSettings";
		  }
	) & {
		page: string;
		keepSelfLink?: boolean;
	},
) => {
	const { keepSelfLink, page } = props;

	const { godMode, season: currentSeason } = useLocalShallow(state2 => ({
		godMode: state2.godMode,
		season: state2.season,
	}));

	let links: {
		url: (string | number)[] | string;
		name: string;
		className?: string;
	}[];
	if (props.type === "team") {
		const { abbrev, season, tid } = props;

		links = [
			{
				url:
					season !== undefined
						? ["roster", `${abbrev}_${tid}`, season]
						: ["roster", `${abbrev}_${tid}`],
				name: "Roster",
			},
			{
				url: ["team_finances", `${abbrev}_${tid}`],
				name: "Finances",
			},
			{
				url:
					season !== undefined
						? ["game_log", `${abbrev}_${tid}`, season]
						: ["game_log", `${abbrev}_${tid}`],
				name: "Game Log",
			},
			{
				url: ["team_history", `${abbrev}_${tid}`],
				name: "History",
			},
			{
				url:
					season !== undefined && season !== currentSeason
						? ["head2head", `${abbrev}_${tid}`, season]
						: ["head2head", `${abbrev}_${tid}`],
				name: "Head-to-Head",
			},
			{
				url: ["schedule", `${abbrev}_${tid}`],
				name: "Schedule",
			},
			{
				url:
					season !== undefined
						? ["transactions", `${abbrev}_${tid}`, season]
						: ["transactions", `${abbrev}_${tid}`],
				name: "Transactions",
			},
			{
				url:
					season !== undefined
						? ["news", `${abbrev}_${tid}`, season]
						: ["news", `${abbrev}_${tid}`],
				name: "News Feed",
			},
		];

		if (isSport("football") || isSport("hockey")) {
			links.unshift({
				url: ["depth", `${abbrev}_${tid}`],
				name: isSport("hockey") ? "Lines" : "Depth Chart",
			});
		}

		if (page === "team_history") {
			links.push({
				url: [
					"player_stats",
					`${abbrev}_${tid}`,
					"career",
					bySport({
						football: "passing",
						basketball: "totals",
						hockey: "skater",
					}),
				],
				name: "Franchise Leaders",
			});
		}
	} else if (props.type === "draft") {
		const { draftType, season } = props;

		links = [
			// { url: ["draft"], name: "Draft", },
			{
				url: ["draft_scouting"],
				name:
					draftType === "freeAgents" ? "Upcoming Prospects" : "Draft Scouting",
			},
		];
		if (!NO_LOTTERY_DRAFT_TYPES.includes(draftType)) {
			links.push({
				url:
					season !== undefined ? ["draft_lottery", season] : ["draft_lottery"],
				name: "Draft Lottery",
			});
		}
		links.push({
			url: season !== undefined ? ["draft_history", season] : ["draft_history"],
			name: draftType === "freeAgents" ? "Prospects History" : "Draft History",
		});
		links.push({ url: ["draft_team_history"], name: "Team History" });
	} else if (props.type == "awards") {
		const { season } = props;

		links = godMode
			? [
					{
						url:
							season == undefined ? ["edit_awards"] : ["edit_awards", season],
						name: "Edit Awards",
						className: "god-mode",
					},
			  ]
			: [];
	} else if (props.type === "playerRatings") {
		const { season } = props;

		links = [
			{
				url: ["player_ratings", season],
				name: "Main Ratings",
			},
			{
				url: ["player_rating_dists", season],
				name: "Rating Distributions",
			},
		];
	} else if (props.type === "playerStats") {
		const { season, statType } = props;
		links = [
			{
				url:
					season !== undefined
						? ["player_stat_dists", season]
						: ["player_stat_dists"],
				name: "Stat Distributions",
			},
		];

		if (season === undefined || page !== "player_stats") {
			links.unshift({
				url: season !== undefined ? ["player_stats", season] : ["player_stats"],
				name: page === "player_stats" ? "Per Game" : "Main Stats",
			});
		} else {
			links.unshift({
				url: [
					"player_stats",
					"all",
					"career",
					isSport("basketball") || statType === undefined ? "totals" : statType,
				],
				name: "Career Totals",
			});
		}
	} else if (props.type === "teamStats") {
		const { season } = props;

		links = [
			{
				url: ["team_stats", season],
				name: "Main Stats",
			},
			{
				url: ["team_stat_dists", season],
				name: "Stat Distributions",
			},
			{ url: ["league_stats"], name: "League Stats" },
		];
	} else if (props.type === "freeAgents") {
		links = [
			{
				url: ["free_agents"],
				name: "Current Free Agents",
			},
			{
				url: ["upcoming_free_agents"],
				name: "Upcoming Free Agents",
			},
		];
	} else if (props.type === "league") {
		links = [
			{ url: ["league_stats"], name: "League Stats" },
			{ url: ["head2head_all"], name: "Head-to-Head" },
			{ url: ["history_all"], name: "League History" },
			{ url: ["team_records"], name: "Team Records" },
			{ url: ["awards_records"], name: "Awards Records" },
			...(isSport("basketball")
				? [
						{
							url: ["all_star", "history"],
							name: "All-Star History",
						},
				  ]
				: []),
			{ url: ["season_preview"], name: "Season Previews" },
		];
	} else if (props.type === "importExport") {
		links = [
			{ url: ["import_players"], name: "Import Players" },
			{ url: ["export_players"], name: "Export Players" },
			{ url: ["export_league"], name: "Export League" },
		];
	} else if (props.type === "schedule") {
		links = [{ url: ["schedule"], name: "Team Schedule" }];
	} else if (props.type === "globalSettings") {
		links = [
			{ url: "/settings", name: "Global Settings" },
			{ url: "/settings/default", name: "Default New League Settings" },
		];
	} else {
		throw new Error("Invalid MoreLinks type");
	}

	if (links.length === 0) {
		return null;
	}

	return (
		<p>
			More:{" "}
			{links
				.filter(({ url }) => {
					if (keepSelfLink) {
						return true;
					}
					const key = typeof url === "string" ? url : url[0];
					return key !== page;
				})
				.map(({ className, url, name }, i) => {
					return (
						<Fragment key={url[0]}>
							{i > 0 ? " | " : null}
							<a
								className={className}
								href={typeof url === "string" ? url : helpers.leagueUrl(url)}
							>
								{name}
							</a>
						</Fragment>
					);
				})}
		</p>
	);
};

export default MoreLinks;
