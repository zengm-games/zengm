import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable } from "../components";
import type { View } from "../../common/types";
import { frivolitiesMenu } from "./Frivolities";
import { PHASE_TEXT } from "../../common";
import PickText from "./TradeSummary/PickText";

const PlayerInfo = ({
	asset,
}: {
	asset: {
		age: number;
		name: string;
		ovr: number;
		pid: number;
		pos: string;
		pot: number;
	};
}) => {
	return (
		<>
			<span className="d-inline-block text-right mr-1" style={{ minWidth: 19 }}>
				{asset.pos}
			</span>
			<a href={helpers.leagueUrl(["player", asset.pid])}>{asset.name}</a> (
			{asset.ovr}/{asset.pot}, {asset.age} yo)
		</>
	);
};

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
		`stat:${process.env.SPORT === "basketball" ? "ws" : "av"}`,
		"Team",
		"Received",
		`stat:${process.env.SPORT === "basketball" ? "ws" : "av"}`,
		"Links",
	);
	for (const i of [4, 7]) {
		if (cols[i].desc) {
			cols[i].desc += " (Total After Trade)";
		}
	}

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
				{
					value: (
						<ul className="list-unstyled mb-0">
							{t.assets.map(asset => {
								if (asset.type === "player") {
									return (
										<li>
											<PlayerInfo asset={asset} />
										</li>
									);
								}

								if (asset.type === "deletedPlayer") {
									return (
										<li>
											<a href={helpers.leagueUrl(["player", asset.pid])}>
												{asset.name}
											</a>
										</li>
									);
								}

								if (asset.type === "realizedPick") {
									return (
										<li>
											<PlayerInfo asset={asset} />
											<br />
											<span className="text-muted" style={{ paddingLeft: 24 }}>
												via <PickText asset={asset} season={trade.season} />
											</span>
										</li>
									);
								}

								if (asset.type === "unrealizedPick") {
									return (
										<li>
											<PickText asset={asset} season={trade.season} />
										</li>
									);
								}
							})}
						</ul>
					),
				},
				t.stat,
			];
		});

		return {
			key: trade.rank,
			data: [
				trade.rank,
				{
					value: `${trade.season} ${PHASE_TEXT[trade.phase]}`,
					sortValue: trade.season + (trade.phase + 10) / 1000,
				},
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
