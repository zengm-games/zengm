import useTitleBar from "../../hooks/useTitleBar.tsx";
import { helpers } from "../../util/helpers.ts";
import { getCols } from "../../../common/getCols.ts";
import { DataTable } from "../../components/DataTable/index.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import type { View } from "../../../common/types.ts";
import { useLocal } from "../../util/local.ts";
import { getCol } from "../../../common/getCol.ts";
import { Fragment, useEffect, useState } from "react";
import { isSport } from "../../../common/sportFunctions.ts";
import { StickyBottomButtons } from "../../components/StickyBottomButtons.tsx";
import {
	awardsToEditingState,
	editingStateToAward,
	EditSettings,
	groupAwards,
	type EditingStateRoot,
} from "./EditSettings.tsx";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";
import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";
import { formatPlayerAwardName } from "../../../common/awards.ts";
import clsx from "clsx";
import { getRows, type InputAward } from "../AwardRaces.tsx";

const MARGIN = 14;

const Title = ({
	asterisk,
	award,
	confs,
	divs,
}: {
	asterisk: boolean;
	award: InputAward;
} & Pick<View<"awardRaces">, "confs" | "divs">) => {
	const group = award.group;
	return (
		<div>
			<h2>
				{formatPlayerAwardName({
					name: award.name,
					numTeams: award.numTeams,
					rank: award.rank ?? 1,
				})}
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

const AwardSettings = ({
	awardCandidates,
	confs,
	divs,
	numGamesPlayoffSeries,
	playoffsByConf,
	season,
	teams,
}: View<"awardSettings">) => {
	useTitleBar({
		title: "Award Settings",
	});

	const {
		challengeNoRatings,
		season: currentSeason,
		userTid,
	} = useLocal(["challengeNoRatings", "season", "userTid"]);

	const [editSettings, setEditSettings] = useState<
		| {
				editing: false;
		  }
		| {
				editing: true;
				awards: EditingStateRoot[];
		  }
	>({
		editing: false,
	});

	useEffect(() => {
		if (!editSettings.editing) {
			setEditSettings((state) => ({
				editing: true,
				awards: awardsToEditingState(awardCandidates),
			}));
		}
	}, [awardCandidates, editSettings.editing]);

	const [saving, setSaving] = useState(false);

	const globalCols = getCols(["#", "Name", "Pos", "Age", "Team"]);

	const saveSettings = (redirect: boolean) => async () => {
		if (!editSettings.editing) {
			setSaving(false);
			return;
		}

		setSaving(true);
		const awards = [];
		const errorMessages: string[] = [];

		const seenShortNames = new Set();
		for (const { editing } of editSettings.awards) {
			if (editing === undefined) {
				continue;
			}

			if (seenShortNames.has(editing.shortName)) {
				errorMessages.push(
					`Duplicate abbrev ${editing.shortName} - award abbrevs must be unique`,
				);
			}
			seenShortNames.add(editing.shortName);

			try {
				awards.push(editingStateToAward(editing));
			} catch (error) {
				errorMessages.push(`${editing.shortName}: ${error.message}`);
			}
		}

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
			if (redirect) {
				await realtimeUpdate([], helpers.leagueUrl(["award_races"]));
				setEditSettings({
					editing: false,
				});
			} else {
				// Do this rather than realtimeUpdate in case the number of awards has changed, like from changing the group setting
				const newAwards = await toWorker("main", "getAwardCandidates", season);
				setEditSettings({
					editing: true,
					awards: awardsToEditingState(newAwards),
				});
			}
		}
	};

	const actualAwardCandidates = editSettings.editing
		? editSettings.awards.map((row) => row.raw)
		: awardCandidates;

	return (
		<>
			<MoreLinks type="awards" page="award_settings" season={season} />

			<div className="row" style={{ marginTop: -MARGIN }}>
				{actualAwardCandidates.map((award, i) => {
					const { mip, rookie, stats } = award;

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
					const key = JSON.stringify([
						award.shortName,
						award.group,
						award.numTeams ? award.rank : undefined,
					]);

					const editing =
						editSettings.editing && editSettings.awards[i]?.editing;

					// When editing, always start a new "group" (team awards for multiple teams, or conf/div groups) on a new row, cause it looks weird to start it in the second column
					const newRow =
						editing &&
						editSettings.awards[i]?.editing &&
						!editSettings.awards[i - 1]?.editing;

					return (
						<Fragment key={key}>
							{newRow ? <div className="w-100" /> : null}
							<div
								className={clsx(
									mip ? "col-12 col-lg-9" : "col-12 col-lg-6",

									// Align to bottom when editing if this is a trailing part of a group, looks better that way
									editSettings.editing && !editing
										? "d-flex align-items-end"
										: undefined,
								)}
								style={{ marginTop: MARGIN }}
							>
								{editSettings.editing ? (
									<div>
										{editSettings.awards[i]?.editing ? (
											<EditSettings
												canMoveDown={editSettings.awards.some((award, j) => {
													// editing undefined check is for group conf/div where there may be other entries of the same editing award
													return j > i && award.editing !== undefined;
												})}
												canMoveUp={i > 0}
												move={(direction) => {
													setEditSettings((oldState) => {
														if (!oldState.editing) {
															return oldState;
														}

														const grouped = groupAwards(oldState.awards);
														const toMoveIndex = grouped.findIndex(
															(group) => group[0]?.raw === award,
														);
														const toMove = grouped[toMoveIndex];
														const otherIndex = toMoveIndex + direction;
														if (!toMove || !grouped[otherIndex]) {
															return oldState;
														}
														grouped[toMoveIndex] = grouped[otherIndex];
														grouped[otherIndex] = toMove;

														return {
															...oldState,
															awards: grouped.flat(),
														};
													});
												}}
												numGamesPlayoffSeries={numGamesPlayoffSeries}
												playoffsByConf={playoffsByConf}
												remove={() => {
													setEditSettings((oldState) => {
														if (!oldState.editing) {
															return oldState;
														}

														const grouped = groupAwards(oldState.awards).filter(
															(group) => {
																return group[0]?.raw !== award;
															},
														);

														return {
															...oldState,
															awards: grouped.flat(),
														};
													});
												}}
												setState={(state) => {
													setEditSettings((oldState) => {
														return oldState.editing
															? {
																	...oldState,
																	awards: oldState.awards.map((award, j) => {
																		return i === j
																			? {
																					raw: award.raw,
																					editing: state,
																				}
																			: award;
																	}),
																}
															: {
																	editing: false,
																};
													});
												}}
												state={editSettings.awards[i].editing}
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
										title={editing ? undefined : title}
									/>
								) : (
									<>
										{editing ? undefined : title}
										<p>No candidates yet...</p>
									</>
								)}
								{asterisk ? (
									<div className="text-body-secondary">
										* Exceptional QBs can win both MVP and {award.shortName}
									</div>
								) : null}
							</div>
						</Fragment>
					);
				})}
			</div>

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
					className="btn btn-primary me-2"
					disabled={saving}
					onClick={saveSettings(false)}
				>
					Save settings
				</button>
			</StickyBottomButtons>
		</>
	);
};

export default AwardSettings;
