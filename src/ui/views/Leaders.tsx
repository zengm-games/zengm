import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import {
	MoreLinks,
	PlayerNameLabels,
	ResponsiveTableWrapper,
} from "../components";
import type { View } from "../../common/types";
import useClickable from "../hooks/useClickable";
import classNames from "classnames";
import { bySport, isSport } from "../../common";

const Row = ({
	cat,
	highlightActiveAndHOF,
	p,
	rank,
	season,
	totals,
}: {
	cat: View<"leaders">["categories"][number];
	p: View<"leaders">["categories"][number]["leaders"][number];
	rank: number;
	totals: boolean;
} & Pick<View<"leaders">, "highlightActiveAndHOF" | "season">) => {
	const { clicked, toggleClicked } = useClickable();

	const numericSeason =
		season === "career" ? undefined : season === "all" ? p.season : season;

	let teamUrlParts;
	if (season === "career") {
		teamUrlParts = ["team_history", `${p.abbrev}_${p.tid}`];
	} else {
		teamUrlParts = ["roster", `${p.abbrev}_${p.tid}`, numericSeason];
	}

	return (
		<tr
			className={classNames({
				"table-danger": highlightActiveAndHOF && p.hof,
				"table-success": highlightActiveAndHOF && p.retiredYear === Infinity,
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
					firstName={p.firstNameShort}
					firstNameShort={p.firstNameShort}
					lastName={p.lastName}
				/>
				<a href={helpers.leagueUrl(teamUrlParts)} className="mx-2">
					{p.abbrev}
					{p.season !== undefined ? ` ${p.season}` : null}
				</a>
				{p.pos}
			</td>
			<td className="text-end">
				{helpers.roundStat(p.stat, cat.stat, totals)}
			</td>
		</tr>
	);
};

export const LeadersTopText = ({
	includeHighlight,
	noHighlightActive,
}: {
	includeHighlight?: boolean;
	noHighlightActive?: boolean;
}) => {
	return (
		<>
			<p>
				Only eligible players are shown (<i>e.g.</i>{" "}
				{bySport({
					baseball:
						"a player with only two plate appearances is not eligible for the league lead in batting average",
					basketball:
						"a player shooting 2 for 2 on the season is not eligible for the league lead in FG%",
					football:
						"a quarterback who is 2 for 2 on the season is not eligible for the league lead in completion percentage",
					hockey:
						"a backup goalie who only played one game is not eligible for the league lead in SV%",
				})}
				).
			</p>
			{includeHighlight ? (
				<p>
					Players from your team are{" "}
					<span className="text-info">highlighted in blue</span>.{" "}
					{noHighlightActive ? (
						""
					) : (
						<>
							Active players are{" "}
							<span className="text-success">highlighted in green</span>.
						</>
					)}
					Hall of Famers are{" "}
					<span className="text-danger">highlighted in red</span>.
				</p>
			) : null}
		</>
	);
};

const Leaders = ({
	categories,
	highlightActiveAndHOF,
	playoffs,
	season,
	statType,
}: View<"leaders">) => {
	useTitleBar({
		title: "League Leaders",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "leaders",
		dropdownFields: {
			seasonsAndCareer: season,
			statTypesStrict: statType,
			playoffs,
		},
	});

	// When season is "all", the season is displayed inline, so columns need to be a bit wider
	const colClassName =
		season === "all" ? "col-12 col-md-6 col-xl-4" : "col-12 col-sm-6 col-md-4";

	return (
		<>
			<MoreLinks
				type="leaders"
				page="leaders"
				playoffs={playoffs}
				season={season}
				statType={statType}
			/>
			<LeadersTopText includeHighlight={highlightActiveAndHOF} />

			<div className="row" style={{ marginTop: -14 }}>
				{categories.map(cat => {
					const col = getCols([`stat:${cat.stat}`])[0];
					if (cat.titleOverride === col.desc) {
						throw new Error("Useless titleOverride");
					}
					const name = cat.titleOverride ?? col.desc;
					const title = cat.titleOverride ? col.desc : undefined;

					return (
						<div
							key={cat.stat}
							className={colClassName}
							style={{ marginTop: 14 }}
						>
							<ResponsiveTableWrapper>
								<table className="table table-striped table-borderless table-sm leaders">
									<thead>
										<tr title={title}>
											<th>{name}</th>
											<th className="text-end">{col.title}</th>
										</tr>
									</thead>
									<tbody>
										{cat.leaders.map((p, j) => (
											<Row
												key={p.key}
												cat={cat}
												highlightActiveAndHOF={highlightActiveAndHOF}
												p={p as any}
												rank={j + 1}
												season={season}
												totals={statType === "totals" && isSport("basketball")}
											/>
										))}
									</tbody>
								</table>
							</ResponsiveTableWrapper>
						</div>
					);
				})}
			</div>
		</>
	);
};

export default Leaders;
