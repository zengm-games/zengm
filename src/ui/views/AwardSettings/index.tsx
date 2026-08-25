import useTitleBar from "../../hooks/useTitleBar.tsx";
import { MoreLinks } from "../../components/MoreLinks.tsx";
import { awardSettingsSchema, type View } from "../../../common/types.ts";
import { Fragment, useEffect, useId, useState } from "react";
import { StickyBottomButtons } from "../../components/StickyBottomButtons.tsx";
import {
	awardsToEditingState,
	awardToEditingState,
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
import { helpers } from "../../util/helpers.ts";
import { downloadFile } from "../../util/downloadFile.ts";
import {
	GAME_ACRONYM,
	LEAGUE_DATABASE_VERSION,
} from "../../../common/constants.ts";
import { ImportFileButton } from "../../components/ImportFileButton.tsx";
import { orderBy } from "../../../common/utils.ts";

const MARGIN = 14;

const getAwardId = (index: number) => `award-${index}`;

const awardsStateToAwards = (
	awardsState: ReturnType<typeof awardsToEditingState>,
) => {
	// Combine error messages from editingStateToAward and awardSettingsSchema
	const errorMessages = [];
	const awards: ReturnType<typeof editingStateToAward>["award"][] = [];
	for (const [index, { editing }] of awardsState.entries()) {
		const { award, errorMessages: errorMessagesTemp } = editingStateToAward(
			editing,
			index,
		);
		awards.push(award);
		if (errorMessagesTemp) {
			errorMessages.push(...errorMessagesTemp);
		}
	}

	const result = awardSettingsSchema.safeParse(awards);
	if (result.success) {
		if (errorMessages.length === 0) {
			return result.data;
		}
	} else {
		errorMessages.push(
			...result.error.issues.map((error) => {
				const index = error.path[0] as any;
				return {
					index,
					message: error.message,
				};
			}),
		);
	}

	// Some error messages can be repeated, like if there are multiple duplicate abbrevs
	// Also sort in order of index (how they are displayed in UI)
	const uniqueErrorMessages = Array.from(
		new Set(
			orderBy(errorMessages, "index", "asc").map(({ index, message }) => {
				const shortName = awards[index]?.shortName;
				let output = shortName !== undefined ? `${shortName}: ` : "";
				output += message;
				return output;
			}),
		),
	);

	showNotification({
		type: "error",
		text: (
			<>
				{uniqueErrorMessages.map((errorMessage, i) => {
					return <p key={i}>{errorMessage}</p>;
				})}
			</>
		),
	});
};

const AwardSettings = ({
	awardCandidates,
	baseNewAward,
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
	const formId = useId();

	const [scrollToAwardId, setScrollToAwardId] = useState<string | undefined>();
	useEffect(() => {
		if (scrollToAwardId !== undefined) {
			document
				.getElementById(scrollToAwardId)
				?.scrollIntoView({ behavior: "smooth" });

			setScrollToAwardId(undefined);
		}
	}, [scrollToAwardId]);

	const DEFAULT_CLASSES = "col-12 col-lg-6";

	return (
		<>
			<MoreLinks type="awards" page="award_settings" season={season} />

			<form
				id={formId}
				className="row"
				style={{ marginTop: -MARGIN }}
				onSubmit={async (event) => {
					event.preventDefault();
					setSaving(true);
					const awards = awardsStateToAwards(awardsState);
					if (awards) {
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
				{awardsState.map(({ awards, editing }, i) => {
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
									id={showEditSettings ? getAwardId(i) : undefined}
									className={clsx(
										award.mip ? "col-12 col-lg-9" : DEFAULT_CLASSES,

										// Align to bottom when editing if this is a trailing part of a group, looks better that way
										!showEditSettings ? "d-flex align-items-end" : undefined,
									)}
									style={{
										marginTop: MARGIN,
										scrollMarginTop: showEditSettings ? 60 : undefined,
									}}
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

														setScrollToAwardId(getAwardId(otherIndex));

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
				<div className={DEFAULT_CLASSES} style={{ marginTop: MARGIN }}>
					<button
						className="btn btn-secondary btn-lg"
						type="button"
						onClick={() => {
							setAwardsState((oldState) => {
								const newAward = helpers.deepCopy(baseNewAward);
								const existingShortNames = new Set(
									oldState.map((row) => row.editing.shortName),
								);
								if (existingShortNames.has(newAward.shortName)) {
									let i = 2;
									const initialShortName = newAward.shortName;
									while (existingShortNames.has(newAward.shortName)) {
										newAward.shortName = `${initialShortName}${i}`;
										i += 1;
									}
								}
								return [
									...oldState,
									{
										awards: [newAward],
										editing: awardToEditingState(newAward),
									},
								];
							});
						}}
					>
						Add award
					</button>
				</div>
			</form>

			<StickyBottomButtons>
				<ImportFileButton
					accept=".json,.gz,application/json,application/gzip"
					withFile={async (file) => {
						try {
							const { basicInfo } = await toWorker(
								"leagueFileUpload",
								"initialCheck",
								{
									file,
								},
							);

							if (!basicInfo.gameAttributes) {
								throw new Error("League file does not contain any settings.");
							}
							if (!basicInfo.gameAttributes.awards) {
								throw new Error(
									"League file does not contain any award settings.",
								);
							}

							const result = awardSettingsSchema.safeParse(
								basicInfo.gameAttributes.awards,
							);

							console.log(basicInfo.gameAttributes.awards, result);
						} catch (error) {
							showNotification({
								type: "error",
								text: error.message,
							});
						}
					}}
				/>
				<button
					type="button"
					className="btn btn-secondary mx-2"
					onClick={() => {
						const awards = awardsStateToAwards(awardsState);
						if (awards) {
							downloadFile(
								`${GAME_ACRONYM}_award_settings.json`,
								JSON.stringify(
									{
										version: LEAGUE_DATABASE_VERSION,
										gameAttributes: { awards },
									},
									undefined,
									2,
								),
								"application/json",
							);
						}
					}}
				>
					Export
				</button>
				<ActionButton
					form={formId}
					type="submit"
					className="ms-auto"
					variant="primary"
					processing={saving}
					processingText="Saving"
				>
					Save settings
				</ActionButton>
			</StickyBottomButtons>
		</>
	);
};

export default AwardSettings;
