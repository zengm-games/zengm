import PropTypes from "prop-types";
import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MovOrDiff } from "../components";
import type { View } from "../../common/types";
import { bySport, isSport, POSITIONS, RATINGS } from "../../common";

const Other = ({
	actualShowHealthy,
	current,
	healthy,
}: {
	actualShowHealthy: boolean;
	current: number;
	healthy: number;
}) => {
	if (actualShowHealthy || current === healthy) {
		return <>{healthy}</>;
	}

	return (
		<>
			<span className={healthy > current ? "text-success" : "text-danger"}>
				{current}
			</span>
		</>
	);
};

const HeadToHead = ({
	abbrev,
	season,
	teams,
	ties,
	otl,
	userTid,
}: View<"headToHead">) => {
	useTitleBar({
		title: "Head-to-Head",
		dropdownView: "head2head",
		dropdownFields: {
			teams: abbrev,
			seasonsAndAll: season,
		},
	});

	const cols = getCols(
		"Team",
		"W",
		"L",
		...(otl ? ["OTL"] : []),
		...(ties ? ["T"] : []),
		"%",
		"PS",
		"PA",
		"Series Won",
		"Series Lost",
	);

	const rows = teams.map(t => {
		const urlParts: (string | number)[] = ["roster", `${t.abbrev}_${t.tid}`];
		if (season !== "all") {
			urlParts.push(season);
		}

		return {
			key: t.tid,
			data: [
				<a href={helpers.leagueUrl(urlParts)}>
					{t.region} {t.name}
				</a>,
				t.won,
				t.lost,
				...(otl ? [t.otl] : []),
				...(ties ? [t.tied] : []),
				t.winp,
				t.pts,
				t.oppPts,
				t.seriesWon,
				t.seriesLost,
			],
			classNames: {
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="HeadToHead"
				nonfluid
				rows={rows}
			/>
		</>
	);
};

export default HeadToHead;
