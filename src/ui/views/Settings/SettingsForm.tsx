import classNames from "classnames";
import { useState, FormEvent, useEffect } from "react";
import { groupBy } from "../../../common/groupBy";
import { ActionButton, StickyBottomButtons } from "../../components";
import { confirm, localActions, logEvent } from "../../util";
import { settings } from "./settings";
import type { Key, Values } from "./types";
import type { Settings } from "../../../worker/views/settings";
import type {
	InjuriesSetting,
	PlayerBioInfo,
	TragicDeaths,
} from "../../../common/types";
import SettingsFormOptions from "./SettingsFormOptions";
import categories from "./categories";
import useSettingsFormState from "./useSettingsFormState";

export const encodeDecodeFunctions = {
	bool: {
		stringify: (value: boolean) => String(value),
		parse: (value: string) => value === "true",
	},
	custom: {},
	float: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	float1000: {
		stringify: (value: number) => String(value / 1000),
		parse: (value: string) => {
			const parsed = parseFloat(value) * 1000;
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	floatOrNull: {
		stringify: (value: number | null) => (value === null ? "" : String(value)),
		parse: (value: string) => {
			if (value === "") {
				return null;
			}

			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	int: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseInt(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid integer`);
			}
			return parsed;
		},
	},
	intOrNull: {
		stringify: (value: number | null) => (value === null ? "" : String(value)),
		parse: (value: string) => {
			if (value === "") {
				return null;
			}

			const parsed = parseInt(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid integer`);
			}
			return parsed;
		},
	},
	string: {},
	jsonString: {
		stringify: (value: any) => JSON.stringify(value),
		parse: (value: string) => JSON.parse(value),
	},
	rangePercent: {
		stringify: (value: number) => String(value),
		parse: (value: string) => {
			const parsed = parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`"${value}" is not a valid number`);
			}
			return parsed;
		},
	},
	floatValuesOrCustom: {
		stringify: (value: number, values: Values) => {
			const stringValue = String(value);
			return JSON.stringify([
				values.every(({ key }) => key !== stringValue),
				stringValue,
			]);
		},
		parse: (value: string) => {
			const parts = JSON.parse(value);
			const numberPart = parseFloat(parts[1]);
			if (Number.isNaN(numberPart)) {
				throw new Error(`"${numberPart}" is not a valid number`);
			}
			return numberPart;
		},
	},
};

const GodModeSettingsButton = ({
	children,
	className,
	godMode,
	disabled,
	onClick,
}: {
	children: any;
	className?: string;
	godMode: boolean;
	disabled?: boolean;
	onClick: () => void;
}) => {
	if (godMode) {
		return null;
	}

	return (
		<button
			type="button"
			className={classNames("btn btn-secondary", className)}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

export const settingNeedsGodMode = (
	godModeRequired?: "always" | "existingLeagueOnly",
	newLeague?: boolean,
) => {
	return !!godModeRequired && (!newLeague || godModeRequired === "always");
};

export const settingIsEnabled = (
	godMode: boolean,
	newLeague: boolean | undefined,
	godModeRequired?: "always" | "existingLeagueOnly",
) => {
	return godMode || !settingNeedsGodMode(godModeRequired, newLeague);
};

export const getVisibleCategories = ({
	godMode,
	filteredSettings,
	newLeague,
	showGodModeSettings,
}: {
	godMode: boolean;
	filteredSettings: typeof settings;
	newLeague: boolean | undefined;
	showGodModeSettings: boolean;
}) => {
	const visibleCategories = [];

	const groupedSettings = groupBy(filteredSettings, "category");

	for (const category of categories) {
		if (!groupedSettings[category.name]) {
			continue;
		}

		const catSettings = groupedSettings[category.name].filter(option => {
			return (
				(showGodModeSettings ||
					settingIsEnabled(godMode, newLeague, option.godModeRequired)) &&
				!option.hidden
			);
		});

		if (catSettings.length === 0) {
			continue;
		}

		visibleCategories.push({
			...category,
			settings: catSettings,
		});
	}

	return visibleCategories;
};

export const SPECIAL_STATE_OTHERS = [
	"injuries",
	"tragicDeaths",
	"playerBioInfo",
] as const;
export const SPECIAL_STATE_BOOLEANS = ["godMode", "godModeInPast"] as const;
export const SPECIAL_STATE_ALL = [
	...SPECIAL_STATE_BOOLEANS,
	...SPECIAL_STATE_OTHERS,
];
export type SpecialStateOthers = typeof SPECIAL_STATE_OTHERS[number];
type SpecialStateBoolean = typeof SPECIAL_STATE_BOOLEANS[number];
type SpecialStateAll = typeof SPECIAL_STATE_ALL[number];

export type State = Record<Exclude<Key, SpecialStateAll>, string> &
	Record<SpecialStateBoolean, boolean> &
	Record<"injuries", InjuriesSetting> &
	Record<"tragicDeaths", TragicDeaths> &
	Record<"playerBioInfo", PlayerBioInfo | undefined>;

const SettingsForm = ({
	onCancel,
	onCancelDefaultSetting,
	onSave,
	onUpdateExtra,
	hasPlayers,
	newLeague,
	realPlayers,
	saveText = "Save Settings",
	initialSettings,
	settingsShown,
	hideShortcuts,
	defaultNewLeagueSettings,
	alwaysShowGodModeSettings,
}: {
	onCancel?: () => void;
	onCancelDefaultSetting?: (key: Key) => void;
	onSave: (settings: Settings) => void;
	onUpdateExtra?: () => void;
	hasPlayers?: boolean;
	newLeague?: boolean;
	realPlayers?: boolean;
	saveText?: string;
	initialSettings: Settings;
	hideShortcuts?: boolean;
	defaultNewLeagueSettings?: boolean;
	alwaysShowGodModeSettings?: boolean;

	// Used to filter diplayed settings, for the DefaultSettings page
	settingsShown?: Key[];
}) => {
	useEffect(() => {
		localActions.update({
			stickyFormButtons: true,
		});

		return () => {
			localActions.update({
				stickyFormButtons: false,
			});
		};
	}, []);

	const [showGodModeSettings, setShowGodModeSettings] = useState(true);

	const {
		godMode,
		handleChange,
		handleChangeRaw,
		state,
		setState,
		gameSimPreset,
		setGameSimPreset,
	} = useSettingsFormState({
		initialSettings,
		onUpdateExtra,
	});

	const handleGodModeToggle = async () => {
		let proceed: any = true;
		if (
			!state.godMode &&
			!state.godModeInPast &&
			!initialSettings.godModeInPast
		) {
			proceed = await confirm(
				"God Mode enables tons of customization features, including many of the settings found here. But if you ever enable God Mode in a league, you will not be awarded any achievements in that league, even if you disable God Mode.",
				{
					okText: "Enable God Mode",
				},
			);
		}

		if (proceed) {
			if (state.godMode) {
				setState(prevState => ({
					...prevState,
					godMode: false,
				}));
			} else {
				setState(prevState => ({
					...prevState,
					godMode: true,
					godModeInPast: true,
				}));
			}
		}
	};

	// Filter out the new league only ones when appropriate
	const filteredSettings = settings.filter(setting => {
		return (
			(!settingsShown || settingsShown.includes(setting.key)) &&
			(!setting.showOnlyIf ||
				setting.showOnlyIf({
					defaultNewLeagueSettings,
					hasPlayers,
					newLeague,
					realPlayers,
				}))
		);
	});

	const [submitting, setSubmitting] = useState(false);

	const handleFormSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitting(true);

		const output = {} as unknown as Settings;
		for (const primaryOption of filteredSettings) {
			const options = [primaryOption];
			if (primaryOption.partners) {
				for (const partner of primaryOption.partners) {
					const partnerOption = settings.find(
						setting => setting.key === partner,
					);
					if (partnerOption) {
						options.push(partnerOption);
					}
				}
			}

			for (const option of options) {
				const { key, name, type } = option;
				const value = state[key];

				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-expect-error
				const parse = encodeDecodeFunctions[type].parse;

				try {
					// @ts-expect-error
					output[key] = parse ? parse(value) : value;
				} catch (error) {
					setSubmitting(false);
					logEvent({
						type: "error",
						text: `${name}: ${error.message}`,
						saveToDb: false,
						persistent: true,
					});
					return;
				}
			}
		}

		for (const key of SPECIAL_STATE_BOOLEANS) {
			output[key] = state[key];
		}

		// Run validation functions at the end, so all values are available
		for (const option of filteredSettings) {
			const { key, name, validator } = option;

			let totalOutput = output;
			if (defaultNewLeagueSettings) {
				totalOutput = {
					// Passing initialSettings here is because from DefaultNewLeagueSettings, output will only contain a subset of settings
					...initialSettings,
					...output,
				};
			}

			try {
				if (validator) {
					await validator(output[key], totalOutput, initialSettings);
				}
			} catch (error) {
				setSubmitting(false);
				logEvent({
					type: "error",
					text: `${name}: ${error.message}`,
					saveToDb: false,
					persistent: true,
				});
				return;
			}
		}

		try {
			await onSave(output);
		} catch (error) {
			console.error(error);
			setSubmitting(false);
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
			return;
		}

		setSubmitting(false);
	};

	const visibleCategories = getVisibleCategories({
		godMode,
		filteredSettings,
		newLeague,
		showGodModeSettings,
	});

	const toggleGodModeSettings = () => {
		setShowGodModeSettings(show => !show);
	};

	const showGodModeSettingsButton = !godMode && !alwaysShowGodModeSettings;

	return (
		<div className="settings-wrapper mt-lg-2">
			<form
				onSubmit={handleFormSubmit}
				className="flex-grow-1"
				style={{ maxWidth: 2100 }}
			>
				{showGodModeSettingsButton ? (
					<GodModeSettingsButton
						className="mb-5 d-sm-none"
						godMode={godMode}
						disabled={submitting}
						onClick={toggleGodModeSettings}
					>
						{showGodModeSettings ? "Hide" : "Show"} God Mode Settings
					</GodModeSettingsButton>
				) : null}

				<SettingsFormOptions
					disabled={submitting}
					gameSimPreset={gameSimPreset}
					godMode={godMode}
					handleChange={handleChange}
					handleChangeRaw={handleChangeRaw}
					newLeague={newLeague}
					onCancelDefaultSetting={onCancelDefaultSetting}
					setGameSimPreset={setGameSimPreset}
					showGodModeSettings={showGodModeSettings}
					state={state}
					visibleCategories={visibleCategories}
				/>

				<StickyBottomButtons>
					<div className="btn-group">
						<button
							className={classNames(
								"btn",
								godMode ? "btn-secondary" : "btn-god-mode",
							)}
							onClick={handleGodModeToggle}
							type="button"
							disabled={submitting}
						>
							{godMode ? "Disable God Mode" : "Enable God Mode"}
						</button>
						{showGodModeSettingsButton ? (
							<GodModeSettingsButton
								className="d-none d-sm-block"
								godMode={godMode}
								disabled={submitting}
								onClick={toggleGodModeSettings}
							>
								{showGodModeSettings ? "Hide" : "Show"} God Mode settings
							</GodModeSettingsButton>
						) : null}
					</div>
					<div className="btn-group ms-auto">
						{onCancel ? (
							<button
								className="btn btn-secondary"
								type="button"
								disabled={submitting}
								onClick={onCancel}
							>
								Cancel
							</button>
						) : null}
						<ActionButton
							type="submit"
							disabled={submitting}
							processing={!!newLeague && submitting}
						>
							{saveText}
						</ActionButton>
					</div>
				</StickyBottomButtons>
			</form>
			{!hideShortcuts ? (
				<div className="settings-shortcuts flex-shrink-0">
					<ul className="list-unstyled">
						<li>Shortcuts: </li>
						{visibleCategories
							.map(category => category.name)
							.map(name => (
								<li key={name} className="settings-shortcut">
									<a href={`#${name}`}>{name}</a>
								</li>
							))}
					</ul>
				</div>
			) : null}
		</div>
	);
};

export default SettingsForm;
