import React, { useState } from "react";
import { getCols, helpers } from "../util";
import useTitleBar from "../hooks/useTitleBar";
import { DataTable } from "../components";
import type { View } from "../../common/types";

const categories =
	process.env.SPORT === "basketball"
		? [
				"mvp",
				"dpoy",
				"smoy",
				"mip",
				"roy",
				"bestRecord",
				"bestRecordConf",
				"allRookie",
				"allLeague",
				"allDefense",
				"allStar",
				"allStarMVP",
		  ]
		: [
				"mvp",
				"dpoy",
				"oroy",
				"droy",
				"bestRecord",
				"bestRecordConf",
				"allRookie",
				"allLeague",
		  ];

const Franchises = ({ teams, ties, userTid }: View<"franchises">) => {
	const [showHistorical, setShowHistorical] = useState(true);

	useTitleBar({
		title: "Franchises",
	});

	let cols = getCols(
		"Team",
		"Start",
		"End",
		"# Seasons",
		"W",
		"L",
		"T",
		"%",
		"Playoffs",
		"Last",
		"Finals",
		"Last",
		"Titles",
		"Last",
		...categories.map(category => `count:${category}`),
	);
	if (!ties) {
		cols = cols.filter(col => col.title !== "T");
	}
	const lasts = cols.filter(col => col.title === "Last");
	lasts[0].desc = "Last Playoffs Appearance";
	lasts[1].desc = "Last Finals Appearance";
	lasts[2].desc = "Last Championship";

	const rows = teams
		.filter(t => showHistorical || t.root)
		.map((t, i) => {
			return {
				key: i,
				data: [
					{
						value: t.root ? (
							<a
								href={helpers.leagueUrl([
									"team_history",
									`${t.abbrev}_${t.tid}`,
								])}
							>
								{t.region} {t.name}
							</a>
						) : (
							<span className="ml-2">
								{t.region} {t.name}
							</span>
						),
						sortValue: t.sortValue,
					},
					t.start,
					t.end,
					t.numSeasons,
					t.won,
					t.lost,
					...(ties ? [t.tied] : []),
					helpers.roundWinp(t.winp),
					t.playoffs,
					t.lastPlayoffs,
					t.finals,
					t.lastFinals,
					t.titles,
					t.lastTitle,
					...categories.map(category => (t as any)[category]),
				],
				classNames: {
					"text-muted": !t.root,
					"table-info": t.root && t.tid === userTid,
				},
			};
		});

	const hasHistoricalTeams = teams.some(t => !t.root);

	return (
		<>
			{hasHistoricalTeams ? (
				<button
					className="btn btn-secondary"
					onClick={() => {
						setShowHistorical(show => !show);
					}}
				>
					{showHistorical ? "Hide historical teams" : "Show historical teams"}
				</button>
			) : null}
			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="Franchises"
				nonfluid
				pagination={false}
				rows={rows}
			/>
		</>
	);
};

export default Franchises;
