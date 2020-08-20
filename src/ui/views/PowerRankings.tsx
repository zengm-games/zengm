import PropTypes from "prop-types";
import React, { useState } from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MarginOfVictory } from "../components";
import type { View } from "../../common/types";
import { POSITIONS, RATINGS } from "../../common";

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

const PowerRankings = ({
	challengeNoRatings,
	currentSeason,
	season,
	teams,
	ties,
	userTid,
}: View<"powerRankings">) => {
	useTitleBar({
		title: "Power Rankings",
		dropdownView: "power_rankings",
		dropdownFields: { seasons: season },
	});

	const [showHealthy, setShowHealthy] = useState(true);
	const actualShowHealthy = showHealthy || currentSeason !== season;

	const otherKeys =
		process.env.SPORT === "basketball"
			? RATINGS
			: POSITIONS.filter(pos => pos !== "KR" && pos !== "PR");

	const superCols = [
		{
			title: "",
			colspan: 2,
		},
		{
			title: "Team Rating",
			colspan: 2,
		},
		{
			title: "",
			colspan: ties ? 5 : 4,
		},
		{
			title: (
				<>
					{process.env.SPORT === "basketball"
						? "Rating Ranks"
						: "Position Ranks"}
					{currentSeason === season ? (
						<a
							className="ml-2"
							href=""
							onClick={event => {
								event.preventDefault();
								setShowHealthy(val => !val);
							}}
						>
							{showHealthy ? "(Show with injuries)" : "(Show without injuries)"}
						</a>
					) : null}
				</>
			),
			colspan: otherKeys.length,
		},
	];

	const colNames = [
		"#",
		"Team",
		"Current",
		"Healthy",
		"W",
		"L",
		...(ties ? ["T"] : []),
		"L10",
		"stat:mov",
		...(process.env.SPORT === "basketball"
			? otherKeys.map(rating => `rating:${rating}`)
			: otherKeys.map(pos => `pos:${pos}`)),
	];

	const cols = getCols(...colNames);

	if (process.env.SPORT === "basketball") {
		for (let i = 0; i < colNames.length; i++) {
			if (colNames[i].startsWith("rating:")) {
				cols[i].sortSequence = ["asc", "desc"];
			}
		}
	}

	const rows = teams.map(t => {
		return {
			key: t.tid,
			data: [
				t.rank,
				<a
					href={helpers.leagueUrl([
						"roster",
						`${t.seasonAttrs.abbrev}_${t.tid}`,
						season,
					])}
				>
					{t.seasonAttrs.region} {t.seasonAttrs.name}
				</a>,
				!challengeNoRatings ? (
					t.ovr !== t.ovrCurrent ? (
						<span className="text-danger">{t.ovrCurrent}</span>
					) : (
						t.ovrCurrent
					)
				) : null,
				!challengeNoRatings ? t.ovr : null,
				t.seasonAttrs.won,
				t.seasonAttrs.lost,
				...(ties ? [t.seasonAttrs.tied] : []),
				t.seasonAttrs.lastTen,
				<MarginOfVictory>{t.stats.mov}</MarginOfVictory>,
				...otherKeys.map(key => ({
					value: (
						<Other
							actualShowHealthy={actualShowHealthy}
							current={t.otherCurrent[key]}
							healthy={t.other[key]}
						/>
					),
					sortValue: actualShowHealthy ? t.other[key] : t.otherCurrent[key],
				})),
			],
			classNames: {
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<p>
				The power ranking is a combination of recent performance, margin of
				victory, and team rating. Team rating is based only on the ratings of
				players on each team.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "asc"]}
				name="PowerRankings"
				nonfluid
				rows={rows}
				superCols={superCols}
			/>
		</>
	);
};

PowerRankings.propTypes = {
	season: PropTypes.number.isRequired,
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			ovr: PropTypes.number.isRequired,
			ovrCurrent: PropTypes.number.isRequired,
			rank: PropTypes.number.isRequired,
			tid: PropTypes.number.isRequired,
			seasonAttrs: PropTypes.shape({
				abbrev: PropTypes.string.isRequired,
				lastTen: PropTypes.string.isRequired,
				lost: PropTypes.number.isRequired,
				name: PropTypes.string.isRequired,
				region: PropTypes.string.isRequired,
				won: PropTypes.number.isRequired,
			}),
			stats: PropTypes.shape({
				mov: PropTypes.number.isRequired,
			}),
		}),
	).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PowerRankings;
