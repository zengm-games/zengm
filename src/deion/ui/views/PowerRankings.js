import PropTypes from "prop-types";
import React from "react";
import { getCols, helpers, setTitle } from "../util";
import { DataTable, Dropdown, NewWindowLink } from "../components";

const PowerRankings = ({ season, teams, userTid }) => {
	setTitle("Power Rankings");

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
				<a href={helpers.leagueUrl(["roster", t.abbrev, season])}>
					{t.region} {t.name}
				</a>,
				t.ovr !== t.ovrCurrent ? (
					<span className="text-danger">{t.ovrCurrent}</span>
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
			<Dropdown view="power_rankings" fields={["seasons"]} values={[season]} />
			<h1>
				Power Rankings <NewWindowLink />
			</h1>

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
