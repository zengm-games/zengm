import useTitleBar from "../../hooks/useTitleBar.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import type { View } from "../../../common/types.ts";
import { Fragment, useState } from "react";
import { StickyBottomButtons } from "../../components/StickyBottomButtons.tsx";
import {
	awardsToEditingState,
	editingStateToAward,
	EditSettings,
	groupAwards,
} from "./EditSettings.tsx";
import { showNotification } from "../../util/showNotification.ts";
import { toWorker } from "../../util/toWorker.ts";
import clsx from "clsx";
import { AwardRaceTable, getAwardKey } from "../AwardRaces.tsx";

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

	const saveSettings = async () => {
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
		}

		setSaving(false);

		if (errorMessages.length === 0) {
			// Do this rather than realtimeUpdate in case the number of awards has changed, like from changing the group setting
			const newAwards = await toWorker("main", "getAwardCandidates", season);
			setAwardsState(awardsToEditingState(newAwards));
		}
	};

	return (
		<>
			<MoreLinks type="awards" page="award_settings" season={season} />

			<div className="row" style={{ marginTop: -MARGIN }}>
				{awardsState.map(({ raw: award, editing }, i) => {
					const key = getAwardKey(award);

					// When editing, always start a new "group" (team awards for multiple teams, or conf/div groups) on a new row, cause it looks weird to start it in the second column
					const newRow = editing && !awardsState[i - 1]?.editing;

					return (
						<Fragment key={key}>
							{newRow ? <div className="w-100" /> : null}
							<div
								className={clsx(
									award.mip ? "col-12 col-lg-9" : "col-12 col-lg-6",

									// Align to bottom when editing if this is a trailing part of a group, looks better that way
									!editing ? "d-flex align-items-end" : undefined,
								)}
								style={{ marginTop: MARGIN }}
							>
								{editing ? (
									<div>
										<EditSettings
											canMoveDown={awardsState.some((award, j) => {
												// editing undefined check is for group conf/div where there may be other entries of the same editing award
												return j > i && award.editing !== undefined;
											})}
											canMoveUp={i > 0}
											move={(direction) => {
												setAwardsState((oldState) => {
													const grouped = groupAwards(oldState);
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
												setAwardsState((oldState) => {
													const grouped = groupAwards(oldState).filter(
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
												setAwardsState((oldState) => {
													return oldState.map((award, j) => {
														return i === j
															? {
																	raw: award.raw,
																	editing: state,
																}
															: award;
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
								/>
							</div>
						</Fragment>
					);
				})}
			</div>

			<StickyBottomButtons>
				<button
					className="btn btn-primary me-2"
					disabled={saving}
					onClick={() => {
						saveSettings();
					}}
				>
					Save settings
				</button>
			</StickyBottomButtons>
		</>
	);
};

export default AwardSettings;
