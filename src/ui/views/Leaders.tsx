import PropTypes from "prop-types";
import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import { PlayerNameLabels, ResponsiveTableWrapper } from "../components";
import type { View } from "../../common/types";
import useClickable from "../hooks/useClickable";
import classNames from "classnames";

const Row = ({
	cat,
	p,
	rank,
	season,
}: {
	cat: any;
	p: any;
	rank: number;
	season: number;
}) => {
	const { clicked, toggleClicked } = useClickable();

	return (
		<tr
			className={classNames({
				"table-info": p.userTeam,
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td>
				{rank}.{" "}
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					skills={p.ratings.skills}
					watch={p.watch}
				>
					{p.nameAbbrev}
				</PlayerNameLabels>
				<a
					href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`, season])}
					style={{
						marginLeft: "6px",
					}}
				>
					{p.abbrev}
				</a>
			</td>
			<td>
				{cat.stat === "WS/48"
					? helpers.roundWinp(p.stat)
					: helpers.roundStat(p.stat, cat.statProp)}
			</td>
		</tr>
	);
};

const Leaders = ({ categories, playoffs, season }: View<"leaders">) => {
	useTitleBar({
		title: "League Leaders",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "leaders",
		dropdownFields: {
			seasons: season,
			playoffs,
		},
	});

	return (
		<>
			<p>
				Only eligible players are shown (<i>e.g.</i>{" "}
				{process.env.SPORT === "basketball"
					? "a player shooting 2 for 2 on the season is not eligible for the league lead in FG%"
					: "a quarterback who is 2 for 2 on the season is not eligible for the league lead in completion percentage"}
				).
			</p>

			<div className="row" style={{ marginTop: -14 }}>
				{categories.map(cat => (
					<div
						key={cat.name}
						className="col-12 col-sm-6 col-md-4"
						style={{ marginTop: 14 }}
					>
						<ResponsiveTableWrapper>
							<table className="table table-striped table-bordered table-sm leaders">
								<thead>
									<tr title={cat.title}>
										<th>{cat.name}</th>
										<th>{cat.stat}</th>
									</tr>
								</thead>
								<tbody>
									{cat.data.map((p, j) => (
										<Row
											key={p.pid}
											cat={cat}
											p={p}
											rank={j + 1}
											season={season}
										/>
									))}
								</tbody>
							</table>
						</ResponsiveTableWrapper>
					</div>
				))}
			</div>
		</>
	);
};

Leaders.propTypes = {
	categories: PropTypes.arrayOf(PropTypes.object).isRequired,
	playoffs: PropTypes.oneOf(["playoffs", "regularSeason"]).isRequired,
	season: PropTypes.number.isRequired,
};

export default Leaders;
