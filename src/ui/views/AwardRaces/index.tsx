import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import { getCols } from "../../../common/getCols.ts";
import { DataTable } from "../../components/DataTable/index.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import type { View } from "../../../common/types.ts";
import { PLAYER } from "../../../common/constants.ts";
import { wrappedPlayerNameLabels } from "../../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../../components/DataTable/index.tsx";
import { RatingWithChange } from "../../components/RatingWithChange.tsx";
import { StatWithChange } from "../../components/StatWithChange.tsx";
import { useLocal } from "../../util/local.ts";
import { getCol } from "../../../common/getCol.ts";
import { useEffect, useState } from "react";
import { isSport } from "../../../common/sportFunctions.ts";
import { StickyBottomButtons } from "../../components/StickyBottomButtons.tsx";
import {
	awardsToEditingState,
	editingStateToAward,
	EditSettings,
	type EditingState,
} from "./EditSettings.tsx";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";
import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";

const MARGIN = 14;

export type InputAward = View<"awardRaces">["awardCandidates"][number];

const Title = ({
	asterisk,
	award,
	confs,
	divs,
}: {
	asterisk: boolean;
	award: InputAward;
} & Pick<View<"awardRaces">, "confs" | "divs">) => {
	const { group, name } = award;
	return (
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
};

const getRows = ({
	award,
	challengeNoRatings,
	currentSeason,
	season,
	teams,
	userTid,
}: {
	award: InputAward;
	challengeNoRatings: boolean;
	currentSeason: number;
	userTid: number;
} & Pick<View<"awardRaces">, "season" | "teams">) => {
	const { mip, rookie, players, stats } = award;

	const rows: DataTableRow[] = players.map((p, j) => {
		const ps = p.currentStats;
		const pr = p.ratings.findLast((row) => row.season === season);

		const pos = pr?.pos ?? "?";
		const abbrev = ps?.abbrev;
		const tid = ps?.tid;
		const t = teams[tid];

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
				<a href={helpers.leagueUrl(["roster", `${abbrev}_${tid}`, season])}>
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

			const ps2 = p.stats.findLast((row) => {
				if (row.season !== season - 1) {
					return false;
				}

				if (award.statRange === undefined && ps.playoffs !== false) {
					return false;
				}
				if (award.statRange === "playoffs" && ps.playoffs !== true) {
					return false;
				}
				if (award.statRange === "combined" && ps.playoffs !== "combined") {
					return false;
				}

				return true;
			});

			const comparePlayersRange =
				award.statRange === "playoffs"
					? "p"
					: award.statRange === "combined"
						? "c"
						: "r";

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
						`${p.pid}-${season - 1}-${comparePlayersRange},${p.pid}-${season}-${comparePlayersRange}`,
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

	return rows;
};

const AwardRaces = ({
	awardCandidates,
	confs,
	divs,
	edit,
	numGamesPlayoffSeries,
	playoffsByConf,
	season,
	teams,
}: View<"awardRaces">) => {
	useTitleBar({
		title: "Award Races",
		jumpTo: true,
		jumpToSeason: season,
		dropdownView: "award_races",
		dropdownFields: edit
			? {}
			: {
					seasons: season,
				},
	});

	const {
		challengeNoRatings,
		season: currentSeason,
		userTid,
	} = useLocal(["challengeNoRatings", "season", "userTid"]);

	const [editSettings, setEditSettings] = useState<
		| {
				editing: false;
				awards?: (EditingState | undefined)[];
		  }
		| {
				editing: true;
				awards: (EditingState | undefined)[];
		  }
	>({
		editing: false,
	});

	useEffect(() => {
		if (edit && !editSettings.editing) {
			setEditSettings((state) => ({
				editing: true,
				awards: state.awards ?? awardsToEditingState(awardCandidates),
			}));
		}
	}, [awardCandidates, edit, editSettings.editing]);

	const [saving, setSaving] = useState(false);

	const globalCols = getCols(["#", "Name", "Pos", "Age", "Team"]);

	return (
		<>
			<MoreLinks type="awards" page="award_races" season={season} />

			{!editSettings.editing ? (
				<div className="mb-3">
					<button
						className="btn btn-secondary"
						onClick={() => {
							realtimeUpdate([], helpers.leagueUrl(["award_races", "edit"]));
						}}
					>
						Edit award settings
					</button>
				</div>
			) : null}

			<div className="row" style={{ marginTop: -MARGIN }}>
				{awardCandidates.map((award, i) => {
					const { group, mip, rookie, stats } = award;

					const asterisk =
						isSport("football") &&
						award.numTeams === undefined &&
						award.opoyFormula !== undefined;

					const cols = [
						...globalCols,
						...getCols([rookie ? "Pick" : "Record", "Ovr"]),
						...getCols(stats.map((stat) => `stat:${stat}`)),
					];
					if (mip) {
						cols.push(getCol("Compare"));
					}

					const rows = getRows({
						award,
						challengeNoRatings,
						currentSeason,
						season,
						teams,
						userTid,
					});

					const title = (
						<Title
							asterisk={asterisk}
							award={award}
							confs={confs}
							divs={divs}
						/>
					);
					const key = `${award.shortName}-${group === undefined ? "" : group.type === "conf" ? group.cid : group.type === "div" ? group.did : `${group.tids[0]}-${group.tids[1]}`}`;

					return (
						<div
							key={key}
							className={mip ? "col-12 col-lg-9" : "col-12 col-lg-6"}
							style={{ marginTop: MARGIN }}
						>
							{editSettings.editing ? (
								<div>
									{editSettings.awards[i] ? (
										<EditSettings
											numGamesPlayoffSeries={numGamesPlayoffSeries}
											playoffsByConf={playoffsByConf}
											setState={(state) => {
												setEditSettings((oldState) => {
													return oldState.awards
														? {
																...oldState,
																awards: oldState.awards.map((award, j) => {
																	return i === j ? state : award;
																}),
															}
														: {
																editing: false,
															};
												});
											}}
											state={editSettings.awards[i]}
										/>
									) : null}
								</div>
							) : null}
							{rows.length > 0 ? (
								<DataTable
									classNameWrapper="mb-1"
									cols={cols}
									defaultSort={[0, "asc"]}
									defaultStickyCols={window.mobile ? 0 : 2}
									hideAllControls
									name={`AwardRaces${key}`}
									rows={rows}
									title={
										editSettings.editing && editSettings.awards[i]
											? undefined
											: title
									}
								/>
							) : (
								<>
									{editSettings ? undefined : title}
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

			{editSettings.editing ? (
				<StickyBottomButtons>
					<button
						className="btn btn-secondary ms-auto me-2"
						disabled={saving}
						onClick={async () => {
							await realtimeUpdate([], helpers.leagueUrl(["award_races"]));
							setEditSettings((oldState) => {
								return {
									...oldState,
									editing: false,
								};
							});
						}}
					>
						Cancel
					</button>
					<button
						className="btn btn-primary ms-2 me-2"
						disabled={saving}
						onClick={async () => {
							setSaving(true);
							const awards = [];
							const errorMessages: string[] = [];

							const seenShortNames = new Set();
							for (const award of editSettings.awards) {
								if (award === undefined) {
									continue;
								}

								if (seenShortNames.has(award.shortName)) {
									errorMessages.push(
										`Duplicate abbrev ${award.shortName} - award abbrevs must be unique`,
									);
								}
								seenShortNames.add(award.shortName);

								try {
									awards.push(editingStateToAward(award));
								} catch (error) {
									errorMessages.push(`${award.shortName}: ${error.message}`);
								}
							}
							console.log(awards);

							if (errorMessages.length > 0) {
								showNotification({
									type: "error",
									text: (
										<>
											{errorMessages.map((errorMessage, i) => {
												return <p key={i}>{errorMessage}</p>;
											})}
										</>
									),
								});
							} else {
								await toWorker("main", "updateGameAttributes", {
									awards,
								});
							}

							setSaving(false);

							if (errorMessages.length === 0) {
								await realtimeUpdate([], helpers.leagueUrl(["award_races"]));
								setEditSettings({
									editing: false,
								});
							}
						}}
					>
						Save award settings
					</button>
				</StickyBottomButtons>
			) : null}
		</>
	);
};

export default AwardRaces;
