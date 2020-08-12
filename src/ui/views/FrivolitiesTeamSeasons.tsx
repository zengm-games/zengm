import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, PlayerNameLabels, MarginOfVictory } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

const FrivolitiesTeamSeasons = ({
	description,
	teamSeasons,
	ties,
	title,
	type,
	userTid,
}: View<"frivolitiesTeamSeasons">) => {
	useTitleBar({ title, customMenu: frivolitiesMenu });

	const cols = getCols(
		"#",
		"Team",
		"Season",
		"W",
		"L",
		...(ties ? ["T"] : []),
		"%",
		"stat:mov",
		...(type !== "best_non_playoff" ? ["Rounds Won"] : []),
		"Links",
	);

	const rows = teamSeasons.map(ts => {
		return {
			key: ts.rank,
			data: [
				ts.rank,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${ts.abbrev}_${ts.tid}`,
						ts.season,
					])}
				>
					{ts.region} {ts.name}
				</a>,
				ts.season,
				ts.won,
				ts.lost,
				...(ties ? [ts.tied] : []),
				helpers.roundWinp(ts.winp),
				<MarginOfVictory>{ts.mov}</MarginOfVictory>,
				...(type !== "best_non_playoff" ? [ts.playoffRoundsWon] : []),
				<>
					<a href={helpers.leagueUrl(["standings", ts.season])}>Standings</a> |{" "}
					<a href={helpers.leagueUrl(["playoffs", ts.season])}>Playoffs</a>
				</>,
			],
			classNames: {
				"table-info": ts.tid === userTid,
			},
		};
	});

	return (
		<>
			<p>{description}</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name={`FrivolitiesTeamSeasons_${type}`}
				nonfluid
				rows={rows}
			/>
		</>
	);
};

export default FrivolitiesTeamSeasons;
