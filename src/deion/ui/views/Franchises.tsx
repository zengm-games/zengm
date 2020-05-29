import React, { ReactNode } from "react";
import { getCols, helpers } from "../util";
import useTitleBar from "../hooks/useTitleBar";
import { DataTable } from "../components";
import type { View } from "../../common/types";

const Franchises = ({ teams, ties, userTid }: View<"franchises">) => {
	useTitleBar({
		title: "Franchises",
	});

	let cols = getCols(
		"Team",
		"Start",
		"End",
		"# Seasons",
		"stat:gp",
		"W",
		"L",
		"T",
		"%",
		"Playoffs",
		"Championships",
	);
	if (!ties) {
		cols = cols.filter(col => col.title !== "T");
	}

	const rows = teams.map((t, i) => {
		return {
			key: i,
			data: [
				{
					value: t.root ? (
						<a
							href={helpers.leagueUrl(["team_history", `${t.abbrev}_${t.tid}`])}
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
				t.won + t.lost + t.tied,
				t.won,
				t.lost,
				...(ties ? [t.tied] : []),
				helpers.roundWinp(t.winp),
				t.playoffs,
				t.championships,
			],
			classNames: {
				"text-muted": !t.root,
				"table-info": t.root && t.tid === userTid,
			},
		};
	});

	return (
		<>
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
