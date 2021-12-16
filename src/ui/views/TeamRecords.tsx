import { useState } from "react";
import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import { bySport } from "../../common";

const teamLink = (t: View<"teamRecords">["teams"][number]) => {
	return {
		value: t.root ? (
			<a href={helpers.leagueUrl(["team_history", `${t.abbrev}_${t.tid}`])}>
				{t.region} {t.name}
			</a>
		) : (
			<span className="ms-2">
				{t.region} {t.name}
			</span>
		),
		sortValue: t.sortValue,
	};
};

const categories = bySport({
	basketball: [
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
	],
	football: [
		"mvp",
		"dpoy",
		"oroy",
		"droy",
		"bestRecord",
		"bestRecordConf",
		"allRookie",
		"allLeague",
	],
	hockey: [
		"mvp",
		"dpoy",
		"dfoy",
		"roy",
		"goy",
		"bestRecord",
		"bestRecordConf",
		"allRookie",
		"allLeague",
	],
});

const isHistorical = (t: { root: boolean; disabled?: boolean }) =>
	!t.root || t.disabled;

const TeamRecords = ({
	byType,
	filter,
	teams,
	ties,
	otl,
	usePts,
	userTid,
}: View<"teamRecords">) => {
	const [showHistorical, setShowHistorical] = useState(true);

	useTitleBar({
		title: "Team Records",
		dropdownView: "team_records",
		dropdownFields: { teamRecordType: byType, teamRecordsFilter: filter },
	});

	let displayName: string;
	if (byType === "by_conf") {
		displayName = "Conference";
	} else if (byType === "by_div") {
		displayName = "Division";
	} else {
		displayName = "Team";
	}

	const cols = getCols([
		...(displayName === "Division" ? ["Conference"] : []),
		displayName,
		"Start",
		"End",
		"# Seasons",
		"W",
		"L",
		...(otl ? ["OTL"] : []),
		...(ties ? ["T"] : []),
		...(usePts ? ["PTS", "PTS%"] : ["%"]),
		"Playoffs",
		"Last",
		"Finals",
		"Last",
		"Titles",
		"Last",
		...categories.map(category => `count:${category}`),
	]);

	const lasts = cols.filter(col => col.title === "Last");
	lasts[0].desc = "Last Playoffs Appearance";
	lasts[1].desc = "Last Finals Appearance";
	lasts[2].desc = "Last Championship";

	const rows = teams
		.filter(t => showHistorical || !isHistorical(t))
		.map((t, i) => {
			return {
				key: i,
				data: [
					...(displayName === "Division" ? [t.confName] : []),
					byType === "by_team" ? teamLink(t) : t.name,
					t.start,
					t.end,
					t.numSeasons,
					t.won,
					t.lost,
					...(otl ? [t.otl] : []),
					...(ties ? [t.tied] : []),
					...(usePts
						? [t.pts, helpers.roundWinp(t.ptsPct)]
						: [helpers.roundWinp(t.winp)]),
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
					"table-info": byType === "by_team" && t.root && t.tid === userTid,
				},
			};
		});

	const hasHistoricalTeams = byType === "by_team" && teams.some(isHistorical);

	return (
		<>
			<MoreLinks type="league" page="team_records" />

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
				name="TeamRecords"
				pagination={false}
				rows={rows}
			/>
		</>
	);
};

export default TeamRecords;
