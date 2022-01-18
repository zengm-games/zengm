/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import classNames from "classnames";
import { AnimatePresence, m } from "framer-motion";
import { ChangeEvent, Fragment, ReactNode, useState } from "react";
import { isSport } from "../../../common";
import { HelpPopover } from "../../components";
import gameSimPresets from "./gameSimPresets";
import PlayerBioInfo2 from "./PlayerBioInfo";
import RowsEditor from "./RowsEditor";
import {
	getVisibleCategories,
	settingIsEnabled,
	settingNeedsGodMode,
	SpecialStateOthers,
	State,
} from "./SettingsForm";
import type { Decoration, FieldType, Key, Values } from "./types";

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
	onCancelDefaultSetting,
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
	onCancelDefaultSetting?: () => void;
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
				{onCancelDefaultSetting ? (
					<button
						type="button"
						className="btn-close ms-1"
						title="Restore default"
						onClick={() => {
							onCancelDefaultSetting();
						}}
					></button>
				) : null}
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
	disabled,
	gameSimPreset,
	godMode,
	handleChange,
	handleChangeRaw,
	newLeague,
	onCancelDefaultSetting,
	setGameSimPreset,
	showGodModeSettings,
	state,
	visibleCategories,
}: {
	disabled: boolean;
	gameSimPreset: string;
	godMode: boolean;
	handleChange: (
		name: Key,
		type: FieldType,
	) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
	handleChangeRaw: <Name extends SpecialStateOthers>(
		name: Name,
	) => (value: State[Name]) => void;
	newLeague?: boolean;
	onCancelDefaultSetting?: (key: Key) => void;
	setGameSimPreset: (gameSimPreset: string) => void;
	showGodModeSettings: boolean;
	state: State;
	visibleCategories: ReturnType<typeof getVisibleCategories>;
}) => {
	return (
		<>
			{visibleCategories.map(category => {
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
							{category.settings.map(
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
									const enabled = settingIsEnabled(
										godMode,
										newLeague,
										godModeRequired,
									);
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
															disabled={!enabled || disabled}
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
															disabled={!checked || !enabled || disabled}
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
													disabled={!enabled || disabled}
													godModeRequired={godModeRequired}
													onChange={handleChangeRaw(key)}
													type={key}
												/>
											);
										} else if (key === "playerBioInfo") {
											customFormNode = (
												<PlayerBioInfo2
													defaultValue={state[key]}
													disabled={!enabled || disabled}
													godModeRequired={godModeRequired}
													onChange={handleChangeRaw(key)}
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
													"pe-1": onCancelDefaultSetting,
												})}
											>
												<Option
													type={type}
													disabled={!enabled || disabled}
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
													onCancelDefaultSetting={
														onCancelDefaultSetting
															? () => {
																	onCancelDefaultSetting(key);
															  }
															: undefined
													}
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
