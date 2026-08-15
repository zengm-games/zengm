import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { getCols } from "../../common/getCols.ts";
import { DataTable } from "../components/DataTable/index.tsx";
import { MoreLinks } from "../components/MoreLinks.tsx";
import type { View } from "../../common/types.ts";
import { PLAYER } from "../../common/constants.ts";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";
import { RatingWithChange } from "../components/RatingWithChange.tsx";
import { StatWithChange } from "../components/StatWithChange.tsx";
import { useLocal } from "../util/local.ts";

const AwardRaces = ({
	awardCandidates,
	confs,
	divs,
	season,
	teams,
}: View<"awardRaces">) => {
	useTitleBar({
		title: "Award Races",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "award_races",
		dropdownFields: {
			seasons: season,
		},
	});

	const {
		challengeNoRatings,
		season: currentSeason,
		userTid,
	} = useLocal(["challengeNoRatings", "season", "userTid"]);

	const globalCols = getCols(["#", "Name", "Pos", "Age", "Team"]);

	return (
		<>
			<MoreLinks type="awards" page="award_races" season={season} />

			<div className="row" style={{ marginTop: -14 }}>
				{awardCandidates.map((award) => {
					const { group, mip, rookie, name, players, stats } = award;

					const asterisk =
						award.numTeams === undefined && award.opoyFormula !== undefined;

					const cols = [
						...globalCols,
						...getCols([rookie ? "Pick" : "Record", "Ovr"]),
						...getCols(stats.map((stat) => `stat:${stat}`)),
					];

					if (mip) {
						cols.push(...getCols(["Compare"]));
					}

					const rows: DataTableRow[] = players.map((p, j) => {
						const ps = p.currentStats;
						const pr = p.ratings.findLast((row) => row.season === season);

						const pos = pr ? pr.pos : "?";
						const abbrev = ps ? ps.abbrev : undefined;
						const tid = ps ? ps.tid : undefined;

						const t = teams.find((t) => t.tid === tid);

						let recordOrPick = null;
						if (rookie) {
							if (p.draft.round > 0) {
								recordOrPick = `${p.draft.round}-${p.draft.pick}`;
								if (p.draft.year !== season - 1) {
									recordOrPick += ` (${p.draft.year})`;
								}
							}
						} else {
							if (t) {
								recordOrPick = helpers.formatRecord(t.seasonAttrs);
							}
						}

						const data: DataTableRow["data"] = [
							j + 1,
							wrappedPlayerNameLabels({
								injury: season === currentSeason ? p.injury : undefined,
								jerseyNumber: ps ? ps.jerseyNumber : undefined,
								pid: p.pid,
								season,
								skills: pr ? pr.skills : [],
								defaultWatch: p.watch,
								firstName: p.firstName,
								firstNameShort: p.firstNameShort,
								lastName: p.lastName,
							}),
							pos,
							p.age,
							<>
								<a
									href={helpers.leagueUrl([
										"roster",
										`${abbrev}_${tid}`,
										season,
									])}
								>
									{abbrev}
								</a>
							</>,
							recordOrPick,
						];

						const showRatings = !challengeNoRatings || p.tid === PLAYER.RETIRED;

						if (mip) {
							data.push(
								pr && showRatings ? (
									<RatingWithChange change={pr.dovr}>{pr.ovr}</RatingWithChange>
								) : null,
							);

							let ps2: any;
							for (let i = p.stats.length - 1; i >= 0; i--) {
								if (
									p.stats[i]!.season === season - 1 &&
									!p.stats[i]!.playoffs
								) {
									ps2 = p.stats[i];
									break;
								}
							}
							data.push(
								...stats.map((stat) => {
									if (!ps && !ps2) {
										return null;
									}

									if (!ps2 || stat === "score" || stat === "keyStats") {
										return helpers.roundStat(ps[stat], stat);
									}

									return (
										<StatWithChange change={ps[stat] - ps2[stat]} stat={stat}>
											{ps[stat]}
										</StatWithChange>
									);
								}),
								<a
									href={helpers.leagueUrl([
										"compare_players",
										`${p.pid}-${season - 1}-r,${p.pid}-${season}-r`,
									])}
								>
									Compare
								</a>,
							);
						} else {
							data.push(pr && showRatings ? pr.ovr : null);
							const statsRow = stats.map((stat) => {
								if (p.opoyOverride && stat === "score") {
									// Hide score from UI if opoyOverride because this player was put at #1 due to a different formula (opoyFormula)
									return {
										value: null,
										sortValue: Infinity,
									};
								}

								return ps
									? helpers.roundStat(
											p.statOverrides ? p.statOverrides[stat] : ps[stat],
											stat,
										)
									: null;
							});
							data.push(...statsRow);
						}

						return {
							key: p.pid,
							metadata: {
								type: "player",
								pid: p.pid,
								season,
								playoffs: "regularSeason",
							},
							data,
							classNames: {
								"table-danger": p.hof,
								"table-info": tid === userTid,
							},
						};
					});

					const title = (
						<div>
							<h2>
								{name}
								{asterisk ? "*" : null}
							</h2>
							{group && group.type !== "playoffSeries" ? (
								<h3>
									{group.type === "conf"
										? confs[group.cid]?.name
										: divs[group.did]?.name}
								</h3>
							) : null}
						</div>
					);

					return (
						<div
							key={`${award.shortName}-${group === undefined ? "" : group.type === "conf" ? group.cid : group.type === "div" ? group.did : `${group.tids[0]}-${group.tids[1]}`}`}
							className={mip ? "col-12 col-lg-9" : "col-12 col-lg-6"}
							style={{ marginTop: 14 }}
						>
							{rows.length > 0 ? (
								<DataTable
									classNameWrapper="mb-1"
									cols={cols}
									defaultSort={[0, "asc"]}
									defaultStickyCols={window.mobile ? 0 : 2}
									hideAllControls
									name={`AwardRaces${name}`}
									rows={rows}
									title={title}
								/>
							) : (
								<>
									{title}
									<p>No candidates yet...</p>
								</>
							)}
							{asterisk ? (
								<div className="text-body-secondary">
									* Exceptional QBs can win both MVP and {award.shortName}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</>
	);
};

export default AwardRaces;
