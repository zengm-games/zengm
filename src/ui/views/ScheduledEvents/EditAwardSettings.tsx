import { useRef, useState } from "react";
import {
	defaultAwards,
	defaultGameAttributes,
} from "../../../common/defaultGameAttributes.ts";
import type { GameAttributesLeague } from "../../../common/types.ts";
import { Documentation } from "../AwardSettings/Documentation.tsx";
import {
	awardSettingToEditingState,
	editingStatesToAwards,
	EditSettings,
	type EditingState,
} from "../AwardSettings/EditSettings.tsx";
import {
	type EditProps,
	FormButtons,
	ReloadSettingsBefore,
} from "./common.tsx";

type Row = {
	// Only used by React
	key: number;

	editing: EditingState;
};

const EditAwardSettings = ({
	awards,
	event,
	numGamesPlayoffSeries,
	onCancel,
	onSave,
	playoffsByConf,
	saving,
	seasonPhaseInvalid,
	setError,
}: EditProps<"awards"> & {
	// Award settings right before this event
	awards: GameAttributesLeague["awards"];

	numGamesPlayoffSeries: number[];
	playoffsByConf: number | false;
}) => {
	const nextKey = useRef(0);
	const getKey = () => {
		const key = nextKey.current;
		nextKey.current += 1;
		return key;
	};

	const toRows = (awards: GameAttributesLeague["awards"]): Row[] => {
		return awards.map((award) => ({
			key: getKey(),
			editing: awardSettingToEditingState(award),
		}));
	};

	// A new event starts with the award settings from before it, so only the differences need to be entered
	const [rows, setRowsRaw] = useState(() =>
		toRows(event ? event.info.awards : awards),
	);

	// Has the user changed anything since the form was loaded?
	const [dirty, setDirty] = useState(false);
	const setRows: typeof setRowsRaw = (action) => {
		setDirty(true);
		setRowsRaw(action);
	};

	const startOver = (awards: GameAttributesLeague["awards"]) => {
		setRowsRaw(toRows(awards));
		setDirty(false);
	};

	// The award settings from before this event depend on its season/phase, which can be changed while this is open. See ReloadSettingsBefore.
	const awardsKey = JSON.stringify(awards);
	const [loadedAwardsKey, setLoadedAwardsKey] = useState(awardsKey);
	const awardsChanged = awardsKey !== loadedAwardsKey;
	if (awardsChanged && !event && !dirty) {
		setLoadedAwardsKey(awardsKey);
		startOver(awards);
	}

	const save = () => {
		const result = editingStatesToAwards(rows.map((row) => row.editing));
		if (result.errorMessages) {
			setError(result.errorMessages.join(" "));
			return;
		}

		onSave({
			awards: result.awards,
		});
	};

	return (
		<>
			<Documentation />

			{awardsChanged ? (
				<ReloadSettingsBefore
					onReload={() => {
						setLoadedAwardsKey(awardsKey);
						startOver(awards);
					}}
					saving={saving}
					text="The award settings before this event are different now than when you started editing."
				/>
			) : null}

			<form
				onSubmit={(event) => {
					event.preventDefault();
					save();
				}}
			>
				<div className="row">
					{rows.map(({ key, editing }, i) => (
						<div key={key} className="col-12 col-lg-6 mb-3">
							<EditSettings
								canMoveDown={i < rows.length - 1}
								canMoveUp={i > 0}
								disabled={saving}
								move={(direction) => {
									setRows((prev) => {
										const toMove = prev[i];
										const other = prev[i + direction];
										if (!toMove || !other) {
											return prev;
										}

										const newRows = [...prev];
										newRows[i] = other;
										newRows[i + direction] = toMove;
										return newRows;
									});
								}}
								numGamesPlayoffSeries={numGamesPlayoffSeries}
								playoffsByConf={playoffsByConf}
								remove={() => {
									setRows((prev) => prev.filter((row) => row.key !== key));
								}}
								setState={(state) => {
									setRows((prev) =>
										prev.map((row) =>
											row.key === key
												? {
														key,
														editing: state,
													}
												: row,
										),
									);
								}}
								state={editing}
							/>
						</div>
					))}
				</div>
				<FormButtons
					onCancel={onCancel}
					saving={saving}
					disabled={seasonPhaseInvalid}
				>
					<button
						className="btn btn-secondary"
						disabled={saving}
						type="button"
						onClick={() => {
							setRows((prev) => {
								const existingShortNames = new Set(
									prev.map((row) => row.editing.shortName),
								);
								let shortName = "NEW";
								let i = 2;
								while (existingShortNames.has(shortName)) {
									shortName = `NEW${i}`;
									i += 1;
								}

								return [
									...prev,
									{
										key: getKey(),
										editing: awardSettingToEditingState({
											shortName,
											name: "New Award",
											formula: defaultAwards.mvp.formula,
											showStats: defaultAwards.mvp.showStats,
										}),
									},
								];
							});
						}}
					>
						Add award
					</button>
					<button
						className="btn btn-secondary"
						disabled={saving}
						type="button"
						onClick={() => {
							setRows(toRows(defaultGameAttributes.awards));
						}}
					>
						Reset to default
					</button>
				</FormButtons>
			</form>
		</>
	);
};

export default EditAwardSettings;
