import React from "react";
import { helpers } from "../util";

const MoreLinks = ({
	type,
	page,
	...info
}: {
	type: "team";
	page: string;
	abbrev: string;
	tid: number;
	season?: number;
}) => {
	let links;
	if (type === "team") {
		const { abbrev, season, tid } = info;
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
