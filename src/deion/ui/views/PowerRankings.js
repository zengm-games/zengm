import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../util";
import { DataTable, NewWindowLink } from "../components";

const PowerRankings = ({ teams, userTid }) => {
	setTitle("Power Rankings");

	const superCols = [
		{
			title: "",
			colspan: 2,
		},
		{
			title: "Team Ovr",
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
				<a href={helpers.leagueUrl(["roster", t.abbrev])}>
					{t.region} {t.name}
				</a>,
				t.ovr !== t.ovrCurrent ? (
					<>
						{t.ovrCurrent}
						<span className="badge badge-danger badge-injury">+</span>
					</>
				) : (
					t.ovrCurrent
				),
				t.ovr,
				t.seasonAttrs.won,
				t.seasonAttrs.lost,
				t.seasonAttrs.lastTen,
				<span className={t.stats.mov > 0 ? "text-success" : "text-danger"}>
					{t.stats.mov.toFixed(1)}
				</span>,
			],
			classNames: {
				"table-info": t.tid === userTid,
			},
		};
	});

	return (
		<>
			<h1>
				Power Rankings <NewWindowLink />
			</h1>

			<p>
				Ranks are a combination of recent performance, margin of victory, and
				player ratings.
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
	teams: PropTypes.arrayOf(
		PropTypes.shape({
			abbrev: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			ovr: PropTypes.number.isRequired,
			ovrCurrent: PropTypes.number.isRequired,
			rank: PropTypes.number.isRequired,
			region: PropTypes.string.isRequired,
			tid: PropTypes.number.isRequired,
			seasonAttrs: PropTypes.shape({
				lastTen: PropTypes.string.isRequired,
				lost: PropTypes.number.isRequired,
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
