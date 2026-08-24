import useTitleBar from "../../hooks/useTitleBar.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import type { View } from "../../../common/types.ts";
import { Fragment, useState } from "react";
import { StickyBottomButtons } from "../../components/StickyBottomButtons.tsx";
import {
	awardsToEditingState,
	editingStateToAward,
	EditSettings,
} from "./EditSettings.tsx";
import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";
import clsx from "clsx";
import { AwardRaceTable, getAwardKey } from "../AwardRaces.tsx";
import { useBlocker } from "../../hooks/useBlocker.ts";
import { ActionButton } from "../../components/ActionButton.tsx";
import { formatTeamNumber } from "../../../common/awards.ts";

const MARGIN = 14;

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

	const [awardsState, setAwardsState] = useState(() =>
		awardsToEditingState(awardCandidates),
	);

	const [saving, setSaving] = useState(false);

	const { setDirty } = useBlocker();

	return (
		<>
			<MoreLinks type="awards" page="award_settings" season={season} />

			<div className="row" style={{ marginTop: -MARGIN }}>
				{awardsState.flatMap(({ awards, editing }, i) => {
					return awards.map((award, j) => {
						const key = getAwardKey(award);

						const showEditSettings = j === 0;

						// When editing, always start a new "group" (team awards for multiple teams, or conf/div groups) on a new row, cause it looks weird to start it in the second column
						const newRow = showEditSettings && awards.length > 1;

						const titleParts = [];
						if (award.group && award.group.type !== "playoffSeries") {
							titleParts.push(
								award.group.type === "conf"
									? (confs[award.group.cid]?.name ?? "Unknown conf")
									: (divs[award.group.did]?.name ?? "Unknown div"),
							);
						}
						if (award.numTeams !== undefined && award.numTeams > 1) {
							titleParts.push(formatTeamNumber(award.rank));
						}
						const title =
							titleParts.length > 0 ? <h4>{titleParts.join(", ")}</h4> : "";

						return (
							<Fragment key={key}>
								{newRow ? <div className="w-100" /> : null}
								<div
									className={clsx(
										award.mip ? "col-12 col-lg-9" : "col-12 col-lg-6",

										// Align to bottom when editing if this is a trailing part of a group, looks better that way
										!showEditSettings ? "d-flex align-items-end" : undefined,
									)}
									style={{ marginTop: MARGIN }}
								>
									{showEditSettings ? (
										<div>
											<EditSettings
												canMoveDown={i < awardsState.length - 1}
												canMoveUp={i > 0}
												move={(direction) => {
													setAwardsState((oldState) => {
														const toMove = oldState[i];
														const otherIndex = i + direction;
														if (!toMove || !oldState[otherIndex]) {
															return oldState;
														}
														oldState[i] = oldState[otherIndex];
														oldState[otherIndex] = toMove;

														return [...oldState];
													});
												}}
												numGamesPlayoffSeries={numGamesPlayoffSeries}
												playoffsByConf={playoffsByConf}
												remove={() => {
													setAwardsState((oldState) => {
														return oldState.filter((row, k) => i !== k);
													});
												}}
												setState={(state) => {
													setDirty(true);
													setAwardsState((oldState) => {
														return oldState.map((row, k) => {
															return i === k
																? {
																		awards: row.awards,
																		editing: state,
																	}
																: row;
														});
													});
												}}
												state={editing}
											/>
										</div>
									) : null}
									<AwardRaceTable
										confs={confs}
										divs={divs}
										rowsInfo={{ award, season, teams }}
										titleOverride={title}
									/>
								</div>
							</Fragment>
						);
					});
				})}
			</div>

			<StickyBottomButtons>
				<ActionButton
					className="ms-auto"
					variant="primary"
					processing={saving}
					processingText="Saving"
					onClick={async () => {
						setSaving(true);
						const awards = [];
						const errorMessages: string[] = [];

						const seenShortNames = new Set();
						for (const { editing } of awardsState) {
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

							// Do this rather than realtimeUpdate in case the number of awards has changed, like from changing the group setting
							const newAwards = await toWorker(
								"main",
								"getAwardCandidates",
								season,
							);
							setAwardsState(awardsToEditingState(newAwards));
							setDirty(false);
						}

						setSaving(false);
					}}
				>
					Save settings
				</ActionButton>
			</StickyBottomButtons>
		</>
	);
};

export default AwardSettings;
