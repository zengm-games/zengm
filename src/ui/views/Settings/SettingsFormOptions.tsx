/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import classNames from "classnames";
import { AnimatePresence, m } from "framer-motion";
import PropTypes from "prop-types";
import { ChangeEvent, Fragment, ReactNode, useState } from "react";
import { isSport, WEBSITE_ROOT } from "../../../common";
import { groupBy } from "../../../common/groupBy";
import { HelpPopover } from "../../components";
import { helpers } from "../../util";
import gameSimPresets from "./gameSimPresets";
import PlayerBioInfo2 from "./PlayerBioInfo";
import RowsEditor from "./RowsEditor";
import type { settings } from "./settings";
import type { Category, Decoration, FieldType, Values } from "./types";

const settingNeedsGodMode = (
	godModeRequired?: "always" | "existingLeagueOnly",
	newLeague?: boolean,
) => {
	return !!godModeRequired && (!newLeague || godModeRequired === "always");
};

export const godModeRequiredMessage = (
	godModeRequired?: "always" | "existingLeagueOnly",
) => {
	if (godModeRequired === "existingLeagueOnly") {
		return "This setting can only be changed in God Mode or when creating a new league.";
	}
	return "This setting can only be changed in God Mode.";
};

const inputStyle = {
	width: 150,
};

const Input = ({
	decoration,
	disabled,
	godModeRequired,
	id,
	maxWidth,
	onChange,
	type,
	value,
	values,
}: {
	decoration?: Decoration;
	disabled?: boolean;
	godModeRequired?: "always" | "existingLeagueOnly";
	id: string;
	maxWidth?: true;
	name: string;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: string;
	values?: Values;
}) => {
	const title = disabled ? godModeRequiredMessage(godModeRequired) : undefined;
	const commonProps = {
		className: "form-control",
		disabled,
		title,
		id,
		onChange,
		style:
			!decoration &&
			type !== "rangePercent" &&
			type !== "floatValuesOrCustom" &&
			!maxWidth
				? inputStyle
				: undefined,
		value,
	};

	let inputElement;
	if (type === "bool") {
		const checked = value === "true";
		const switchTitle = title ?? (checked ? "Enabled" : "Disabled");
		inputElement = (
			<div className="form-check form-switch" title={switchTitle}>
				<input
					className="form-check-input"
					type="checkbox"
					id={id}
					disabled={disabled}
					checked={checked}
					onChange={onChange}
				/>
				<label className="form-check-label" htmlFor={id} />
			</div>
		);
	} else if (type === "rangePercent") {
		inputElement = (
			<div className="d-flex" style={inputStyle}>
				<div className="text-end me-1" style={{ minWidth: 38 }}>
					{Math.round(parseFloat(value) * 100)}%
				</div>
				<div>
					<input
						type="range"
						{...commonProps}
						className="form-range"
						min="0"
						max="1"
						step="0.05"
					/>
				</div>
			</div>
		);
	} else if (values) {
		if (type === "floatValuesOrCustom") {
			const parsed = JSON.parse(value);
			const selectValue =
				parsed[0] || values.every(({ key }) => key !== parsed[1])
					? "custom"
					: parsed[1];
			inputElement = (
				<div className="input-group" style={inputStyle}>
					<select
						{...commonProps}
						className="form-select"
						value={selectValue}
						style={{ width: 60 }}
					>
						{values.map(({ key, value }) => (
							<option key={key} value={key}>
								{value}
							</option>
						))}
						<option value="custom">Custom</option>
					</select>
					<input
						type="text"
						className="form-control"
						disabled={selectValue !== "custom"}
						onChange={onChange}
						value={parsed[1]}
					/>
				</div>
			);
		} else {
			inputElement = (
				<select {...commonProps} className="form-select">
					{values.map(({ key, value }) => (
						<option key={key} value={key}>
							{value}
						</option>
					))}
				</select>
			);
		}
	} else {
		inputElement = <input type="text" {...commonProps} />;
	}

	if (decoration === "currency") {
		return (
			<div className="input-group" style={inputStyle}>
				<div className="input-group-text">$</div>
				{inputElement}
				<div className="input-group-text">M</div>
			</div>
		);
	}

	if (decoration === "percent") {
		return (
			<div className="input-group" style={inputStyle}>
				{inputElement}
				<div className="input-group-text">%</div>
			</div>
		);
	}

	return inputElement;
};

Input.propTypes = {
	decoration: PropTypes.oneOf(["currency", "percent"]),
	disabled: PropTypes.bool,
	onChange: PropTypes.func.isRequired,
	type: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	values: PropTypes.array,
};

const Option = ({
	id,
	disabled,
	name,
	description,
	descriptionLong,
	decoration,
	godModeRequired,
	newLeague,
	maxWidth,
	onChange,
	type,
	value,
	values,
	customForm,
}: {
	id: string;
	disabled: boolean;
	name: string;
	description?: ReactNode;
	descriptionLong?: ReactNode;
	decoration?: Decoration;
	godModeRequired?: "always" | "existingLeagueOnly";
	newLeague?: boolean;
	maxWidth?: true;
	onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	type: FieldType;
	value: unknown;
	values?: Values;
	customForm?: ReactNode;
}) => {
	const [showDescriptionLong, setShowDescriptionLong] = useState(false);

	let formElement;
	if (customForm) {
		formElement = customForm;
	} else {
		if (typeof value !== "string") {
			throw new Error("Value must be string");
		}
		formElement = (
			<Input
				type={type}
				disabled={disabled}
				godModeRequired={godModeRequired}
				id={id}
				maxWidth={maxWidth}
				name={name}
				onChange={onChange}
				value={value}
				values={values}
				decoration={decoration}
			/>
		);
	}

	return (
		<>
			<div className="d-flex align-items-center" style={{ minHeight: 33 }}>
				<div className="me-auto text-nowrap">
					<label
						className="form-label mb-0"
						htmlFor={id}
						onClick={event => {
							// Don't toggle on label click, too confusing
							if (type === "bool") {
								event.preventDefault();
							}
						}}
					>
						{settingNeedsGodMode(godModeRequired, newLeague) ? (
							<span
								className="legend-square god-mode me-1"
								title={godModeRequiredMessage(godModeRequired)}
							/>
						) : null}
						{name.endsWith(" Factor") ? (
							<>
								{name.replace(" Factor", "")}
								<span className="d-none d-lg-inline"> Factor</span>
							</>
						) : (
							name
						)}
					</label>
					{descriptionLong ? (
						<span
							className="ms-1 glyphicon glyphicon-question-sign help-icon"
							onClick={() => {
								setShowDescriptionLong(show => !show);
							}}
						/>
					) : null}
				</div>
				<div className={classNames("ms-auto", maxWidth ? "w-100" : undefined)}>
					{formElement}
				</div>
			</div>
			{description ? (
				<div className="text-muted settings-description mt-1">
					{description}
				</div>
			) : null}
			<AnimatePresence initial={false}>
				{showDescriptionLong ? (
					<m.div
						initial="collapsed"
						animate="open"
						exit="collapsed"
						variants={{
							open: { opacity: 1, height: "auto" },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{
							duration: 0.3,
							type: "tween",
						}}
						className="text-muted settings-description mt-1"
					>
						{descriptionLong}
					</m.div>
				) : null}
			</AnimatePresence>
		</>
	);
};

const SettingsFormOptions = ({
	filteredSettings,
	godMode,
	newLeague,
	showGodModeSettings,
	submitting,
}: {
	filteredSettings: typeof settings;
	godMode: boolean;
	newLeague?: boolean;
	showGodModeSettings: boolean;
	submitting: boolean;
}) => {
	const [gameSimPreset, setGameSimPreset] = useState("default");

	const groupedSettings = groupBy(filteredSettings, "category");

	const settingIsEnabled = (
		godModeRequired?: "always" | "existingLeagueOnly",
	) => {
		return godMode || !settingNeedsGodMode(godModeRequired, newLeague);
	};

	// Specified order
	const categories: {
		name: Category;
		helpText?: ReactNode;
	}[] = [
		{
			name: "New League",
		},
		{
			name: "General",
		},
		{
			name: "Schedule",
			helpText: (
				<>
					<p>
						Changing these settings will only apply to the current season if the
						regular season or playoffs have not started yet. Otherwise, changes
						will be applied for next year. If you are in the regular season and
						have not yet played a game yet, you can regenerate the current
						schedule in the{" "}
						<a href={helpers.leagueUrl(["danger_zone"])}>Danger Zone</a>.
					</p>
					<p>
						The schedule is set by first accounting for "# Division Games" and
						"# Conference Games" for each team. Then, remaining games are filled
						with any remaining teams (non-conference teams, plus maybe division
						and conference teams if one of those settings is left blank).{" "}
						<a
							href={`https://${WEBSITE_ROOT}/manual/customization/schedule-settings/`}
							rel="noopener noreferrer"
							target="_blank"
						>
							More details.
						</a>
					</p>
				</>
			),
		},
		{
			name: "Standings",
		},
		{
			name: "Playoffs",
		},
		{
			name: "Players",
		},
		{
			name: "Teams",
		},
		{
			name: "Draft",
		},
		{
			name: "Finances",
		},
		{
			name: "Inflation",
			helpText: (
				<>
					<p>
						This lets you randomly change your league's financial settings
						(salary cap, min payroll, luxury tax payroll, min contract, max
						contract) every year before the draft. It works by picking a{" "}
						<a
							href="https://en.wikipedia.org/wiki/Truncated_normal_distribution"
							rel="noopener noreferrer"
							target="_blank"
						>
							truncated Gaussian random number
						</a>{" "}
						based on the parameters set below (min, max, average, and standard
						deviation).
					</p>
					{isSport("basketball") ? (
						<p>
							If you have any scheduled events containing specific finance
							changes then these settings will be ignored until all those
							scheduled events have been processed. Basically this means that
							for historical real players leagues, these inflation settings will
							only take effect once your league moves into the future.
						</p>
					) : null}
				</>
			),
		},
		{
			name: "Contracts",
		},
		{
			name: "Events",
		},
		{
			name: "Injuries",
		},
		{
			name: "Game Simulation",
		},
		{
			name: "Elam Ending",
			helpText: (
				<>
					<p>
						The{" "}
						<a
							href="https://thetournament.com/elam-ending"
							rel="noopener noreferrer"
							target="_blank"
						>
							Elam Ending
						</a>{" "}
						is a new way to play the end of basketball games. In the final
						period of the game, when the clock goes below a certain point
						("Minutes Left Trigger"), the clock is turned off. The winner of the
						game will be the team that first hits a target score. That target is
						determined by adding some number of points ("Target Points to Add")
						to the leader's current score.
					</p>
					<p>
						By default, the trigger is 4 minutes remaining and the target points
						to add is 8.
					</p>
					<p>
						The Elam Ending generally makes the end of the game more exciting.
						Nobody is trying to run out the clock. Nobody is trying to foul or
						call strategic timeouts or rush shots. It's just high quality
						basketball, every play until the end of the game.
					</p>
				</>
			),
		},
		{
			name: "All-Star Contests",
		},
		{
			name: "Challenge Modes",
		},
		{
			name: "Game Modes",
		},
		{
			name: "UI",
		},
	];

	const handleChange =
		(name: Key, type: FieldType) =>
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			let value: string;
			if (type === "bool") {
				value = String((event.target as any).checked);
			} else if (type === "floatValuesOrCustom") {
				if (event.target.value === "custom") {
					const raw = state[name];
					if (typeof raw !== "string") {
						throw new Error("Invalid value");
					}

					value = JSON.stringify([true, JSON.parse(raw)[1]]);
				} else {
					value = JSON.stringify([false, event.target.value]);
				}
			} else {
				value = event.target.value;
			}

			setState(prevState => ({
				...prevState,
				[name]: value,
			}));

			if (gameSimPresets && Object.keys(gameSimPresets[2020]).includes(name)) {
				setGameSimPreset("default");
			}
		};

	return (
		<>
			{categories.map(category => {
				if (!groupedSettings[category.name]) {
					return null;
				}

				const catOptions = groupedSettings[category.name].filter(option => {
					return (
						(showGodModeSettings || settingIsEnabled(option.godModeRequired)) &&
						!option.hidden
					);
				});

				if (catOptions.length === 0) {
					return null;
				}
				currentCategoryNames.push(category.name);

				return (
					<Fragment key={category.name}>
						<a className="anchor" id={category.name} />
						<h2 className="mb-3">
							{category.name}
							{category.helpText ? (
								<HelpPopover title={category.name} className="ms-1">
									{category.helpText}
								</HelpPopover>
							) : null}
						</h2>
						{category.name === "Game Simulation" &&
						isSport("basketball") &&
						gameSimPresets &&
						(godMode || showGodModeSettings) ? (
							<select
								className="form-select mb-3"
								style={{
									width: "inherit",
								}}
								value={gameSimPreset}
								disabled={!godMode}
								onChange={event => {
									// @ts-ignore
									const presets = gameSimPresets[event.target.value];
									if (!presets) {
										return;
									}

									const presetsString: any = {};
									for (const [key, value] of Object.entries(presets)) {
										presetsString[key] = String(value);
									}

									setState(prevState => ({
										...prevState,
										...presetsString,
									}));
									setGameSimPreset(event.target.value);
								}}
							>
								<option value="default">
									Select preset based on historical NBA stats
								</option>
								{Object.keys(gameSimPresets)
									.sort()
									.reverse()
									.map(season => (
										<option key={season} value={season}>
											{season}
										</option>
									))}
							</select>
						) : null}
						<div className="row mb-5 mb-md-3">
							{catOptions.map(
								(
									{
										customForm,
										decoration,
										description,
										descriptionLong,
										godModeRequired,
										key,
										maxWidth,
										name,
										type,
										values,
									},
									i,
								) => {
									const enabled = settingIsEnabled(godModeRequired);
									const id = `settings-${category.name}-${name}`;

									let customFormNode;
									if (customForm) {
										if (key === "stopOnInjuryGames") {
											const key2 = "stopOnInjury";
											const checked = state[key2] === "true";
											customFormNode = (
												<div
													style={inputStyle}
													className="d-flex align-items-center"
												>
													<div
														className="form-check form-switch"
														title={checked ? "Enabled" : "Disabled"}
													>
														<input
															type="checkbox"
															className="form-check-input"
															checked={checked}
															disabled={!enabled || submitting}
															onChange={handleChange(key2, "bool")}
															id={id + "2"}
															value={state[key2]}
														/>
														<label
															className="form-check-label"
															htmlFor={id + "2"}
														/>
													</div>
													<div className="input-group">
														<input
															id={id}
															disabled={!checked || !enabled || submitting}
															className="form-control"
															type="text"
															onChange={handleChange(key, type)}
															value={state[key]}
														/>
														<div className="input-group-text">Games</div>
													</div>
												</div>
											);
										} else if (key === "injuries" || key === "tragicDeaths") {
											customFormNode = (
												<RowsEditor
													defaultValue={state[key]}
													disabled={!enabled || submitting}
													godModeRequired={godModeRequired}
													onChange={rows => {
														setState(prevState => ({
															...prevState,
															[key]: rows,
														}));
													}}
													type={key}
												/>
											);
										} else if (key === "playerBioInfo") {
											customFormNode = (
												<PlayerBioInfo2
													defaultValue={state.playerBioInfo}
													disabled={!enabled || submitting}
													godModeRequired={godModeRequired}
													onChange={playerBioInfo => {
														setState(prevState => ({
															...prevState,
															playerBioInfo,
														}));
													}}
												/>
											);
										}
									}

									return (
										<div
											key={key}
											className="settings-col col-md-6 col-xxl-4 d-flex"
										>
											<div
												className={classNames("fake-list-group-item rounded", {
													"settings-striped-bg-alt": i % 2 === 1,
												})}
											>
												<Option
													type={type}
													disabled={!enabled || submitting}
													id={id}
													onChange={handleChange(key, type)}
													value={state[key]}
													values={values}
													decoration={decoration}
													name={name}
													description={description}
													descriptionLong={descriptionLong}
													customForm={customFormNode}
													maxWidth={maxWidth}
													godModeRequired={godModeRequired}
													newLeague={newLeague}
												/>
											</div>
										</div>
									);
								},
							)}
						</div>
					</Fragment>
				);
			})}
		</>
	);
};

export default SettingsFormOptions;
