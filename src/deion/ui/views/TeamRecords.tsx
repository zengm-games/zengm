import PropTypes from "prop-types";
import React from "react";
import { DataTable } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";

const teamLink = (t: {
	abbrev: string;
	name: string;
	region: string;
	tid: number;
}) => {
	return (
		<a href={helpers.leagueUrl(["team_history", `${t.abbrev}_${t.tid}`])}>
			{t.region} {t.name}
		</a>
	);
};

const TeamRecords = ({
	byType,
	categories,
	seasonCount,
	teamRecords,
}: View<"teamRecords">) => {
	useTitleBar({
		title: "Team Records",
		dropdownView: "team_records",
		dropdownFields: { teamRecordType: byType },
	});

	let displayName;
	if (byType === "by_conf") {
		displayName = "Conference";
	} else if (byType === "by_div") {
		displayName = "Division";
	} else {
		displayName = "Team";
	}

	const cols = getCols(
		displayName,
		"W",
		"L",
		"%",
		"Playoffs",
		"Last Playoffs",
		"Finals",
		"Championships",
		"Last Title",
		...categories.map(category => `count:${category}`),
	);
	// MVP, DPOY, SMOY, ROY
	for (let i = 9; i <= 12; i++) {
		cols[i].sortSequence = ["desc", "asc"];
		cols[i].sortType = "number";
	}

	const rows = teamRecords.map(tr => {
		return {
			key: tr.id,
			data: [
				byType === "by_team" ? teamLink(tr.team) : tr.team,
				tr.won,
				tr.lost,
				tr.winp,
				tr.playoffAppearances,
				tr.lastPlayoffAppearance,
				tr.finals,
				tr.championships,
				tr.lastChampionship,
				...categories.map(category => tr[category]),
			],
		};
	});

	return (
		<>
			<p>
				More: <a href={helpers.leagueUrl(["league_stats"])}>League Stats</a> |{" "}
				<a href={helpers.leagueUrl(["history_all"])}>League History</a> |{" "}
				<a href={helpers.leagueUrl(["awards_records"])}>Awards Records</a>
				{process.env.SPORT === "basketball" ? (
					<>
						{" "}
						|{" "}
						<a href={helpers.leagueUrl(["all_star_history"])}>
							All-Star History
						</a>
					</>
				) : null}
			</p>

			<p>Totals over {seasonCount} seasons played.</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="TeamRecords"
				nonfluid
				rows={rows}
			/>
		</>
	);
};

TeamRecords.propTypes = {
	byType: PropTypes.oneOf(["by_conf", "by_div", "by_team"]).isRequired,
	categories: PropTypes.arrayOf(PropTypes.string).isRequired,
	seasonCount: PropTypes.number.isRequired,
	teamRecords: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TeamRecords;
