import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import { PlayerNameLabels, ResponsiveTableWrapper } from "../components";
import type { View } from "../../common/types";
import useClickable from "../hooks/useClickable";
import classNames from "classnames";
import { bySport, isSport } from "../../common";

const Row = ({
	cat,
	p,
	rank,
	season,
}: {
	cat: View<"leaders">["categories"][number];
	p: View<"leaders">["categories"][number]["leaders"][number];
	rank: number;
	season: View<"leaders">["season"];
}) => {
	const { clicked, toggleClicked } = useClickable();

	const numericSeason =
		season === "career" ? undefined : season === "all" ? p.season : season;

	return (
		<tr
			className={classNames({
				"table-info": p.userTeam,
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			<td>
				<div style={{ width: 18 }} className="me-1 float-start">
					{rank}.
				</div>
				<PlayerNameLabels
					pid={p.pid}
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					season={numericSeason}
					skills={p.skills}
					watch={p.watch}
				>
					{p.nameAbbrev}
				</PlayerNameLabels>
				<a
					href={helpers.leagueUrl([
						"roster",
						`${p.abbrev}_${p.tid}`,
						numericSeason,
					])}
					className="mx-2"
				>
					{p.abbrev}
					{p.season !== undefined ? ` ${p.season}` : null}
				</a>
				{isSport("football") || isSport("hockey") ? `${p.pos}` : null}
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
			seasonsAndCareer: season,
			playoffs,
		},
	});

	// When season is "all", the season is displayed inline, so columns need to be a bit wider
	const colClassName =
		season === "all" ? "col-12 col-md-6 col-xl-4" : "col-12 col-sm-6 col-md-4";

	return (
		<>
			<p>
				Only eligible players are shown (<i>e.g.</i>{" "}
				{bySport({
					basketball:
						"a player shooting 2 for 2 on the season is not eligible for the league lead in FG%",
					football:
						"a quarterback who is 2 for 2 on the season is not eligible for the league lead in completion percentage",
					hockey:
						"a backup goalie who only played one game is not eligible for the league lead in SV%",
				})}
				).
			</p>

			<div className="row" style={{ marginTop: -14 }}>
				{categories.map(cat => (
					<div
						key={cat.name}
						className={colClassName}
						style={{ marginTop: 14 }}
					>
						<ResponsiveTableWrapper>
							<table className="table table-striped table-sm leaders">
								<thead>
									<tr title={cat.title}>
										<th>{cat.name}</th>
										<th>{cat.stat}</th>
									</tr>
								</thead>
								<tbody>
									{cat.leaders.map((p, j) => (
										<Row
											key={p.key}
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

export default Leaders;
