import React from "react";
import { NO_LOTTERY_DRAFT_TYPES } from "../../common";
import type { DraftType } from "../../common/types";
import { helpers } from "../util";

const MoreLinks = (
	props:
		| {
				type: "team";
				page: string;
				abbrev: string;
				tid: number;
				season?: number;
		  }
		| {
				type: "draft";
				page: string;
				draftType: DraftType;
				season?: number;
		  },
) => {
	const { page } = props;

	let links: {
		url: (string | number)[];
		name: string;
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
				url: ["schedule", `${abbrev}_${tid}`],
				name: "Schedule",
			},
			{
				url:
					season !== undefined
						? ["news", `${abbrev}_${tid}`, season]
						: ["news", `${abbrev}_${tid}`],
				name: "News Feed",
			},
		];

		if (process.env.SPORT === "football") {
			links.unshift({
				url: ["depth", `${abbrev}_${tid}`],
				name: "Depth Chart",
			});
		}

		if (page === "team_history") {
			links.push({
				url: [
					"player_stats",
					`${abbrev}_${tid}`,
					"career",
					process.env.SPORT === "football" ? "passing" : "totals",
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
	} else {
		throw new Error("Invalid MoreLinks type");
	}

	return (
		<p>
			More:{" "}
			{links
				.filter(({ url }) => url[0] !== page)
				.map(({ url, name }, i) => {
					return (
						<React.Fragment key={url[0]}>
							{i > 0 ? " | " : null}
							<a href={helpers.leagueUrl(url)}>{name}</a>
						</React.Fragment>
					);
				})}
		</p>
	);
};

export default MoreLinks;
