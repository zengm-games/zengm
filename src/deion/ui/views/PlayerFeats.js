import PropTypes from "prop-types";
import React from "react";
import {
	DataTable,
	Dropdown,
	NewWindowLink,
	PlayerNameLabels,
} from "../components";
import { getCols, helpers, setTitle } from "../util";

const PlayerFeats = ({ abbrev, feats, season, stats, userTid }) => {
	setTitle("Statistical Feats");

	const cols = getCols(
		"Name",
		"Pos",
		"Team",
		...stats.map(stat => `stat:${stat}`),
		"Opp",
		"Result",
		"Season",
		"Type",
	);

	const rows = feats.map(p => {
		return {
			key: p.fid,
			data: [
				<PlayerNameLabels injury={p.injury} pid={p.pid} watch={p.watch}>
					{p.name}
				</PlayerNameLabels>,
				p.pos,
				<a href={helpers.leagueUrl(["roster", p.abbrev, p.season])}>
					{p.abbrev}
				</a>,
				...stats.map(stat => helpers.roundStat(p.stats[stat], stat, true)),
				<a href={helpers.leagueUrl(["roster", p.oppAbbrev, p.season])}>
					{p.oppAbbrev}
				</a>,
				<a
					href={helpers.leagueUrl([
						"game_log",
						p.abbrev === undefined ? "special" : p.abbrev,
						p.season,
						p.gid,
					])}
				>
					{p.won ? "W" : "L"} {p.score}
				</a>,
				p.season,
				p.type,
			],
			classNames: {
				"table-info": p.tid === userTid,
			},
		};
	});

	const superCols =
		process.env.SPORT === "football"
			? [
					{
						title: "",
						colspan: 3,
					},
					{
						title: "Passing",
						colspan: 4,
					},
					{
						title: "Rushing",
						colspan: 3,
					},
					{
						title: "Receiving",
						colspan: 3,
					},
					{
						title: "Defense",
						colspan: 7,
					},
					{
						title: "Returns",
						colspan: 2,
					},
					{
						title: "",
						colspan: 4,
					},
			  ]
			: undefined;

	return (
		<>
			<Dropdown
				view="player_feats"
				fields={["teamsAndAll", "seasonsAndAll"]}
				values={[abbrev, season]}
			/>
			<h1>
				Statistical Feats <NewWindowLink />
			</h1>

			{process.env.SPORT === "basketball" ? (
				<p>
					All games where a player got a triple double, a 5x5, 50 points, 25
					rebounds, 20 assists, 10 steals, 10 blocks, or 10 threes are listed
					here. If you changed quarter length to a non-default value in God
					Mode, the cuttoffs are scaled. Statistical feats from your players are{" "}
					<span className="text-info">highlighted in blue</span>.
				</p>
			) : (
				<p>
					All games where a player got 400 passing yards, 6 passing TDs, 150
					rushing yards, 3 rushing TDs, 150 receiving yards, 3 receiving TDs, 3
					sacks, 2 interceptions, 2 fumble recoveries, 2 forced fumbles, 2
					defensive TDs, 2 return TDs, 4 rushing/receiving TDs, 200
					rushing/receiving yards, or 5 total TDs (where passing ones count
					half) are listed here. If you changed quarter length to a non-default
					value in God Mode, the cuttoffs are scaled. Statistical feats from
					your players are{" "}
					<span className="text-info">highlighted in blue</span>.
				</p>
			)}

			<DataTable
				cols={cols}
				defaultSort={[23, "desc"]}
				name="PlayerFeats"
				rows={rows}
				superCols={superCols}
				pagination
			/>
		</>
	);
};

PlayerFeats.propTypes = {
	abbrev: PropTypes.string.isRequired,
	feats: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	stats: PropTypes.arrayOf(PropTypes.string).isRequired,
	userTid: PropTypes.number.isRequired,
};

export default PlayerFeats;
