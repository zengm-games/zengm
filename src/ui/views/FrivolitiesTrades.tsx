import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";

const FrivolitiesTrades = ({
	abbrev,
	description,
	title,
	trades,
	type,
	userTid,
}: View<"frivolitiesTrades">) => {
	useTitleBar({
		title,
		customMenu: frivolitiesMenu,
		dropdownView: "frivolitiesTrades",
		dropdownFields: {
			teamsAndAll: abbrev,
		},
	});

	const cols = getCols(
		"#",
		"Season",
		"Team",
		"Received",
		"stat:ws",
		"Team",
		"Received",
		"stat:ws",
		"Links",
	);

	const superCols = [
		{
			title: "",
			colspan: 2,
		},
		{
			title: "Team 1",
			colspan: 3,
		},
		{
			title: "Team 2",
			colspan: 3,
		},
		{
			title: "",
			colspan: 1,
		},
	];

	const rows = trades.map(trade => {
		const teamCols = trade.teams.map(t => {
			return [
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.abbrev}_${t.tid}`,
						trade.season,
					])}
				>
					{t.region} {t.name}
				</a>,
				"ASSETS",
				t.stat,
			];
		});

		return {
			key: trade.rank,
			data: [
				trade.rank,
				"SEASON+PHASE",
				...teamCols[0],
				...teamCols[1],
				<a href={helpers.leagueUrl(["trade_summary", trade.eid])}>Details</a>,
			],
			classNames: {
				"table-info":
					trade.teams[0].tid === userTid || trade.teams[1].tid === userTid,
			},
		};
	});

	return (
		<>
			{description ? <p>{description}</p> : null}

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name={`FrivolitiesTrades_${type}`}
				nonfluid
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

export default FrivolitiesTrades;
