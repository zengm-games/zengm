import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers } from "../util/index.ts";
import {
	DataTable,
	MoreLinks,
	PlayerNameLabels,
} from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { bySport, isSport } from "../../common/index.ts";
import type { DataTableRow } from "../components/DataTable/index.tsx";

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
			playoffsCombined: playoffs,
		},
	});

	// When season is "all", the season is displayed inline, so columns need to be a bit wider
	const colClassName =
		season === "all" ? "col-12 col-md-6 col-xl-4" : "col-12 col-sm-6 col-lg-4";

	const totals = statType === "totals" && isSport("basketball");

	const noQualifiedLeaders = categories.every(
		(cat) => cat.leaders.length === 0,
	);

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

			{noQualifiedLeaders ? (
				<p>No data yet.</p>
			) : (
				<div className="row" style={{ marginTop: -14 }}>
					{categories.map((cat) => {
						const cols = getCols(["#", "Name", `stat:${cat.stat}`]);
						const statCol = cols[2]!;
						if (cat.titleOverride === statCol.desc) {
							throw new Error("Useless titleOverride");
						}

						const title = cat.titleOverride ?? statCol.desc ?? "???";
						const desc = cat.titleOverride ? statCol.desc : undefined;

						const rows: DataTableRow[] = cat.leaders.map((p, j) => {
							const numericSeason =
								season === "career"
									? undefined
									: season === "all"
										? p.season
										: season;

							let teamUrlParts;
							if (season === "career") {
								teamUrlParts = ["team_history", `${p.abbrev}_${p.tid}`];
							} else {
								teamUrlParts = [
									"roster",
									`${p.abbrev}_${p.tid}`,
									numericSeason,
								];
							}

							const seasonText = p.season !== undefined ? ` ${p.season}` : "";

							return {
								key: p.key,
								metadata: {
									type: "player",
									pid: p.pid,
									season: numericSeason ?? "career",
									playoffs,
								},
								data: [
									{
										value: j + 1,
										style: {
											// Need this here rather than in cols becuase we're using hideHeader
											width: 1,
										},
									},
									<>
										<PlayerNameLabels
											pid={p.pid}
											injury={p.injury}
											season={numericSeason}
											skills={p.skills}
											defaultWatch={p.watch}
											firstName={p.firstNameShort}
											firstNameShort={p.firstNameShort}
											lastName={p.lastName}
										/>
										<a href={helpers.leagueUrl(teamUrlParts)} className="mx-2">
											{p.abbrev}
											{seasonText}
										</a>
										{p.pos}
									</>,
									{
										value: helpers.roundStat(p.stat, cat.stat, totals),
										classNames: "text-end",
									},
								],
								classNames: {
									"table-danger": highlightActiveAndHOF && p.hof,
									"table-success":
										highlightActiveAndHOF && p.retiredYear === Infinity,
									"table-info": p.userTeam,
								},
							};
						});

						return (
							<div
								key={cat.stat}
								className={colClassName}
								style={{ marginTop: 14 }}
							>
								<DataTable
									cols={cols}
									defaultSort={"disableSort"}
									hideHeader
									hideAllControls
									name={`LeagueLeaders_${cat.stat}`}
									pagination
									rows={rows}
									title={
										<h3 title={desc}>
											{title} ({statCol.title})
										</h3>
									}
								/>
							</div>
						);
					})}
				</div>
			)}
		</>
	);
};

export default Leaders;
