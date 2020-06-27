import PropTypes from "prop-types";
import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import { DataTable, MarginOfVictory } from "../components";
import type { View } from "../../common/types";

const PowerRankings = ({
	challengeNoRatings,
	season,
	teams,
	userTid,
}: View<"powerRankings">) => {
	useTitleBar({
		title: "Power Rankings",
		dropdownView: "power_rankings",
		dropdownFields: { seasons: season },
	});

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
			colspan: 4,
		},
	];

	const cols = getCols(
		"#",
		"Team",
		"Current",
		"Healthy",
		"W",
		"L",
		"L10",
		"stat:mov",
	);

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
				t.seasonAttrs.lastTen,
				<MarginOfVictory>{t.stats.mov}</MarginOfVictory>,
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
