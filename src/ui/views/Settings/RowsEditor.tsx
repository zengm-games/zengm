import { csvFormat, csvParse } from "d3-dsv";
import { m, AnimatePresence } from "framer-motion";
import { ChangeEvent, CSSProperties, useRef, useState } from "react";
import { Dropdown, Modal } from "react-bootstrap";
import type { InjuriesSetting, TragicDeaths } from "../../../common/types";
import {
	confirm,
	downloadFile,
	helpers,
	logEvent,
	resetFileInput,
	toWorker,
} from "../../util";
import { godModeRequiredMessage } from "./SettingsFormOptions";
import classNames from "classnames";
import { SPORT_HAS_REAL_PLAYERS } from "../../../common";

type Rows<Type> = Type extends "injuries" ? InjuriesSetting : TragicDeaths;
type RowsState<Type> = Type extends "injuries"
	? {
			id: number;
			name: string;
			frequency: string;
			games: string;
	  }[]
	: {
			id: number;
			reason: string;
			frequency: string;
	  }[];

const formatRows = <Type extends "injuries" | "tragicDeaths">(
	rows: Rows<Type>,
): RowsState<Type> => {
	const keys = Object.keys(rows[0]) as any[];
	return rows.map((row: any) => {
		const formatted = {
			id: Math.random(),
		} as any;
		for (const key of keys) {
			if (typeof row[key] === "string") {
				formatted[key] = row[key];
			} else {
				formatted[key] = String(row[key]);
			}
		}
		return formatted;
	});
};

export const IMPORT_FILE_STYLE: CSSProperties = {
	position: "absolute",
	top: 0,
	right: 0,
	minWidth: "100%",
	minHeight: "100%",
	fontSize: 100,
	display: "block",
	filter: "alpha(opacity=0)",
	opacity: 0,
	outline: "none",
};

const getColumns = (type: "injuries" | "tragicDeaths") =>
	type === "injuries"
		? ["name", "frequency", "games"]
		: ["reason", "frequency"];

// https://stackoverflow.com/a/35200633/786644
const ImportButton = <Type extends "injuries" | "tragicDeaths">({
	setErrorMessage,
	setRows,
	type,
}: {
	setErrorMessage: (errorMessage?: string) => void;
	setRows: (injuries: RowsState<Type>) => void;
	type: Type;
}) => (
	<button
		className="btn btn-light-bordered"
		style={{ position: "relative", overflow: "hidden" }}
		onClick={() => {}}
	>
		Import
		<input
			className="cursor-pointer"
			type="file"
			style={IMPORT_FILE_STYLE}
			onClick={resetFileInput}
			onChange={event => {
				if (!event.target.files) {
					return;
				}
				const file = event.target.files[0];
				if (!file) {
					return;
				}

				setErrorMessage();

				const reader = new window.FileReader();
				reader.readAsText(file);

				reader.onload = event2 => {
					try {
						// @ts-expect-error
						const rows = csvParse(event2.currentTarget.result);

						const columns = getColumns(type);

						for (const column of columns) {
							if (!rows.columns.includes(column)) {
								setErrorMessage(
									`File should be a CSV file with columns: ${columns.join(
										", ",
									)}`,
								);
								return;
							}
						}

						setRows(formatRows(rows as any));
					} catch (error) {
						setErrorMessage(error.message);
						return;
					}
				};
			}}
		/>
	</button>
);

const ExportButton = <Type extends "injuries" | "tragicDeaths">({
	rows,
	type,
}: {
	rows: RowsState<Type>;
	type: Type;
}) => (
	<button
		className="btn btn-light-bordered"
		onClick={() => {
			const output = csvFormat(rows as any, getColumns(type));

			downloadFile(`${type}.csv`, output, "text/csv");
		}}
	>
		Export
	</button>
);

const Controls = <Type extends "injuries" | "tragicDeaths">({
	rows,
	position,
	setRows,
	type,
}: {
	rows: RowsState<Type>;
	position: "top" | "bottom";
	setRows: (
		rows: RowsState<Type> | ((rows: RowsState<Type>) => RowsState<Type>),
	) => void;
	type: Type;
}) => {
	const [importErrorMessage, setImportErrorMessage] = useState<
		string | undefined
	>();

	return (
		<>
			<div className="d-flex justify-content-between">
				<div className="btn-group">
					<button
						className="btn btn-light-bordered"
						onClick={() => {
							const newRow =
								type === "injuries"
									? {
											id: Math.random(),
											name: "Injury",
											frequency: "1",
											games: "1",
									  }
									: {
											id: Math.random(),
											reason: "PLAYER_NAME died.",
											frequency: "1",
									  };

							if (position === "top") {
								setRows(rows => [newRow as any, ...rows]);
							} else {
								setRows(rows => [...rows, newRow as any]);
							}
						}}
					>
						Add
					</button>
					<Dropdown>
						<Dropdown.Toggle
							className="btn-light-bordered btn-light-bordered-group-right"
							variant="foo"
							id="dropdown-injuries-reset"
						>
							Reset
						</Dropdown.Toggle>

						<Dropdown.Menu>
							<Dropdown.Item
								onClick={async () => {
									const defaultRows = await toWorker(
										"main",
										`getDefault${helpers.upperCaseFirstLetter(type)}`,
										undefined,
									);
									setRows(formatRows(defaultRows) as any);
								}}
							>
								Default
							</Dropdown.Item>
							<Dropdown.Item
								onClick={() => {
									setRows([]);
								}}
							>
								Clear
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="btn-group">
					<ImportButton
						setErrorMessage={setImportErrorMessage}
						setRows={setRows}
						type={type}
					/>
					<ExportButton rows={rows} type={type} />
				</div>
			</div>

			{importErrorMessage ? (
				<div className="text-danger mt-3">{importErrorMessage}</div>
			) : null}
		</>
	);
};

const isInvalidNumber = (number: number) => Number.isNaN(number) || number <= 0;

const parseAndValidate = <Type extends "injuries" | "tragicDeaths">(
	type: Type,
	rowsState: RowsState<Type>,
): Rows<Type> => {
	const rows = rowsState.map((row: any) => {
		if (type === "injuries") {
			return {
				name: row.name,
				frequency: parseFloat(row.frequency),
				games: parseFloat(row.games),
			};
		}

		return {
			reason: row.reason,
			frequency: parseFloat(row.frequency),
		};
	}) as any as Rows<Type>;

	for (const row of rows) {
		const name = type === "injuries" ? (row as any).name : (row as any).reason;

		if (isInvalidNumber(row.frequency)) {
			throw new Error(
				`Injury "${name}" has an invalid frequency - must be a positive number.`,
			);
		}

		if (type === "injuries") {
			if (isInvalidNumber((row as any).games)) {
				throw new Error(
					`Injury "${name}" has an invalid number of games - must be a positive number.`,
				);
			}
		}
	}

	if (rows.length === 0) {
		throw new Error(
			`You must define at least one ${
				type === "injuries" ? "injury type" : "tragic death"
			}.`,
		);
	}

	return rows;
};

// If animation is enabled, the modal gets stuck open on Android Chrome v91. This happens only when clicking Cancel/Save - the X and clicking outside the modal still works to close it. All my code is working - show does get set false, it does get rendered, just still displayed. Disabling ads makes no difference. It works when calling programmatically wtih ButtonElement.click() but not with an actual click. Disabling animation fixes it though. Also https://mail.google.com/mail/u/0/#inbox/FMfcgzGkZGhkhtPsGFPFxcKxhvZFkHpl
export const animation = false;

const RowsEditor = <Type extends "injuries" | "tragicDeaths">({
	defaultValue,
	disabled,
	godModeRequired,
	onChange,
	type,
}: {
	defaultValue: Rows<Type>;
	disabled: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
	onChange: (rows: Rows<Type>) => void;
	type: Type;
}) => {
	const [show, setShow] = useState(false);
	const [rows, setRowsRaw] = useState(() => formatRows<Type>(defaultValue));
	const [dirty, setDirty] = useState(false);
	const lastSavedRows = useRef<RowsState<Type> | undefined>();

	const setRows = (rows: Parameters<typeof setRowsRaw>[0]) => {
		setRowsRaw(rows);
		setDirty(true);
	};

	const handleShow = () => setShow(true);

	const handleCancel = async () => {
		if (dirty) {
			const result = await confirm(
				"Are you sure you want to discard your changes?",
				{
					okText: "Discard",
					cancelText: "Cancel",
				},
			);
			if (!result) {
				return;
			}

			// Reset for next time
			setRowsRaw(lastSavedRows.current ?? formatRows(defaultValue));
			setDirty(false);
		}

		setShow(false);
	};

	const handleSave = (event: {
		preventDefault: () => void;
		stopPropagation: () => void;
	}) => {
		event.preventDefault();

		// Don't submit parent form
		event.stopPropagation();

		let parsed;
		try {
			parsed = parseAndValidate(type, rows);
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			return;
		}

		// Save for next time
		lastSavedRows.current = rows;
		setDirty(false);

		setShow(false);

		onChange(parsed);
	};

	const handleChange =
		(key: "name" | "frequency" | "games" | "reason", i: number) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setRows(
				rows =>
					rows.map((row, j) => {
						if (i !== j) {
							return row;
						}

						return {
							...row,
							[key]: event.target.value,
						};
					}) as any,
			);
		};

	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;

	const singular = type === "injuries" ? "injury" : "tragic death";
	const singularCapitalized = type === "injuries" ? "Injury" : "Tragic Death";
	const aOrAn = type === "injuries" ? "an" : "a";

	return (
		<>
			<button
				className="btn btn-secondary"
				type="button"
				disabled={disabled}
				title={title}
				onClick={handleShow}
			>
				Customize
			</button>

			<Modal
				show={show}
				onHide={handleCancel}
				animation={animation}
				scrollable
				size={type === "injuries" ? undefined : "xl"}
			>
				<Modal.Header closeButton>
					<Modal.Title>
						{type === "injuries" ? "Injury Types" : "Tragic Death Types"}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>
						The {singular} rate is determined by the "{singularCapitalized}{" "}
						Rate" setting, which is viewable on the main League Settings page.
						When {aOrAn} {singular} occurs, the type of {singular} is randomly
						selected from this list. The probability of a type being selected is
						its "frequency" value divided by the sum of all frequencies.
					</p>
					{type === "injuries" ? (
						<p>
							"Games" is the average number of games that will be missed. There
							is some variability based on luck and health spending.
						</p>
					) : (
						<>
							<p>
								<code>PLAYER_NAME</code> will be replaced by the name of the
								player who died. By default there are two special tragic deaths,
								defined by the codes <code>SPECIAL_CLUE</code> and{" "}
								<code>SPECIAL_GIFTS</code> because internally they have some
								randomly generated parts.
							</p>
							{SPORT_HAS_REAL_PLAYERS ? (
								<p>
									If you're using the built-in rosters with real players, please
									be aware that real players can never experience tragic deaths.
								</p>
							) : null}
						</>
					)}

					<Controls position="top" rows={rows} setRows={setRows} type={type} />

					{rows.length > 0 ? (
						<form onSubmit={handleSave} className="my-3">
							<input type="submit" className="d-none" />
							<div className="row g-2" style={{ marginRight: 22 }}>
								{type === "injuries" ? (
									<>
										<div className="col-6">Name</div>
										<div className="col-3">Frequency</div>
										<div className="col-3">Games</div>
									</>
								) : (
									<>
										<div className="col-9 col-md-10 col-xl-11">Reason</div>
										<div className="col-3 col-md-2 col-xl-1">Frequency</div>
									</>
								)}
							</div>
							<AnimatePresence initial={false}>
								{rows.map((row, i) => (
									<m.div
										key={row.id}
										initial={{ opacity: 0, y: -38 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{}}
										layout
										transition={{ duration: 0.2, type: "tween" }}
									>
										<div className="d-flex">
											<div className="row g-2 flex-grow-1" key={i}>
												{type === "injuries" ? (
													<>
														<div className="col-6">
															<input
																type="text"
																className="form-control"
																value={(row as any).name}
																onChange={handleChange("name", i)}
															/>
														</div>
														<div className="col-3">
															<input
																type="text"
																className={classNames("form-control", {
																	"is-invalid": isInvalidNumber(
																		parseFloat(row.frequency),
																	),
																})}
																value={row.frequency}
																onChange={handleChange("frequency", i)}
															/>
														</div>
														<div className="col-3">
															<input
																type="text"
																className={classNames("form-control", {
																	"is-invalid": isInvalidNumber(
																		parseFloat((row as any).games),
																	),
																})}
																value={(row as any).games}
																onChange={handleChange("games", i)}
															/>
														</div>
													</>
												) : (
													<>
														<div className="col-9 col-md-10 col-xl-11">
															<input
																type="text"
																className="form-control"
																value={(row as any).reason}
																onChange={handleChange("reason", i)}
															/>
														</div>
														<div className="col-3 col-md-2 col-xl-1">
															<input
																type="text"
																className={classNames("form-control", {
																	"is-invalid": isInvalidNumber(
																		parseFloat(row.frequency),
																	),
																})}
																value={row.frequency}
																onChange={handleChange("frequency", i)}
															/>
														</div>
													</>
												)}
											</div>
											<button
												className="text-danger btn btn-link ps-2 pe-0 border-0"
												onClick={() => {
													setRows(rows =>
														(rows as any[]).filter(row2 => row2 !== row),
													);
												}}
												style={{ fontSize: 20 }}
												title="Delete"
												type="button"
											>
												<span className="glyphicon glyphicon-remove" />
											</button>
										</div>
									</m.div>
								))}
							</AnimatePresence>
						</form>
					) : (
						<div className="mt-3 text-danger">
							You must define at least one{" "}
							{type === "injuries" ? "injury type" : "tragic death"}.
						</div>
					)}

					{rows.length > 0 ? (
						<Controls
							position="bottom"
							rows={rows}
							setRows={setRows}
							type={type}
						/>
					) : null}
				</Modal.Body>
				<Modal.Footer>
					<button className="btn btn-secondary" onClick={handleCancel}>
						Cancel
					</button>
					<button
						className="btn btn-primary"
						onClick={handleSave}
						disabled={rows.length === 0}
					>
						Save
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
};

export default RowsEditor;
