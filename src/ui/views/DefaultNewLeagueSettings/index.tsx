import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "react-bootstrap";
import Select from "react-select";
import { SPORT_HAS_REAL_PLAYERS } from "../../../common";
import { groupBy } from "../../../common/groupBy";
import type { View } from "../../../common/types";
import type { Settings } from "../../../worker/views/settings";
import { MoreLinks } from "../../components";
import useTitleBar from "../../hooks/useTitleBar";
import {
	helpers,
	localActions,
	logEvent,
	realtimeUpdate,
	toWorker,
} from "../../util";
import { settings } from "../Settings/settings";
import SettingsForm from "../Settings/SettingsForm";
import type { Key } from "../Settings/types";
import ExportButton from "./ExportButton";
import ImportButton from "./ImportButton";

const DefaultNewLeagueSettings = ({
	defaultSettings,
	overrides,
}: View<"defaultNewLeagueSettings">) => {
	useTitleBar({ title: "Default New League Settings" });

	useEffect(() => {
		localActions.update({
			dirtySettings: false,
		});
	}, []);

	const [importErrorMessage, setImportErrorMessage] = useState<
		string | undefined
	>();

	const [overridesLocal, setOverridesLocal] =
		useState<typeof overrides>(overrides);
	const [overridesLocalCounter, setOverridesLocalCounter] = useState(0);

	const settingsByKey = useMemo(() => groupBy(settings, "key"), []);

	const getKeysFromOverrides = (newOverrides: typeof overrides) => {
		if (!newOverrides) {
			return [];
		}

		const keys = helpers.keys(newOverrides);

		// Handle adding parent of hidden key
		return keys
			.map(key => {
				const setting = settingsByKey[key]?.[0];

				if (!setting) {
					// Remove any non-Key elements
					return [];
				}

				if (setting.hidden) {
					const partner = settings.find(setting =>
						setting?.partners?.includes(key as Key),
					);
					if (partner) {
						return [key, partner.key];
					}
				}

				return key;
			})
			.flat() as Key[];
	};

	const [settingsShown, setSettingsShown] = useState<Key[]>(
		getKeysFromOverrides(overrides),
	);

	const settingsRemainingToSelect = settings.filter(
		setting =>
			!setting.hidden &&
			!settingsShown.includes(setting.key) &&
			(!setting.showOnlyIf ||
				setting.showOnlyIf({
					defaultNewLeagueSettings: true,
					hasPlayers: true,
					newLeague: true,
					realPlayers: true,
				})),
	);

	const options = Object.entries(
		groupBy(settingsRemainingToSelect, "category"),
	).map(([category, catSettings]) => ({
		label: category,
		options: catSettings.map(setting => ({
			label: setting.name,
			value: setting.key,
		})),
	}));

	const onAnyChange = () => {
		setImportErrorMessage(undefined);
		localActions.update({
			dirtySettings: true,
		});
	};

	const removeSettingsEqualToDefault = (settings: Partial<Settings>) => {
		const changedSettings: Partial<Settings> = {};
		for (const key of helpers.keys(settings)) {
			const valueString = JSON.stringify(settings[key]);
			const defaultString = JSON.stringify(defaultSettings[key]);

			if (valueString !== defaultString) {
				(changedSettings as any)[key] = settings[key];
			}
		}

		return changedSettings;
	};

	const removeUnknownSettings = (settings1: Partial<Settings>) => {
		const settings2 = {
			...settings1,
		};

		const allowedKeys = new Set<string>(
			settings
				.map(setting =>
					setting.partners ? [setting.key, ...setting.partners] : setting.key,
				)
				.flat(),
		);
		allowedKeys.add("godMode");
		allowedKeys.add("godModeInPast");

		for (const key of helpers.keys(settings2)) {
			if (!allowedKeys.has(key as any)) {
				delete settings2[key];
			}
		}

		return settings2;
	};

	return (
		<>
			<MoreLinks type="globalSettings" page="/settings/default" />

			<p>Here you can override the normal default settings for new leagues.</p>

			<p>
				If you set a setting here, it will only apply in a new league that does
				not have that setting specified. So if you are uploading an exported
				league containing league settings, it will not be changed by whatever
				you specify here.
				{SPORT_HAS_REAL_PLAYERS
					? " Also, real players leagues have some non-default settings already applied, and those will also not be altered by your specified defaults."
					: null}
			</p>

			<div className="mb-3 d-md-flex">
				<div className="default-settings-select flex-grow-1 me-md-2">
					<Select<{
						label: string;
						value: Key;
					}>
						classNamePrefix="dark-select"
						onChange={newValue => {
							if (newValue) {
								onAnyChange();
								setSettingsShown(shown => [...shown, newValue.value]);
							}
						}}
						options={options}
						placeholder="Select a setting to supply a new default value for..."
						value={null}
					/>
				</div>
				<div className="ms-auto mt-2 mt-md-0 d-flex align-items-center">
					<Dropdown>
						<Dropdown.Toggle
							variant="light-bordered"
							id="default-new-league-settings-add-all"
						>
							Add All...
						</Dropdown.Toggle>
						<Dropdown.Menu>
							<Dropdown.Item
								onClick={() => {
									onAnyChange();
									setSettingsShown(settings.map(setting => setting.key));
								}}
							>
								All Settings
							</Dropdown.Item>
							{options.map(option => (
								<Dropdown.Item
									key={option.label}
									onClick={() => {
										onAnyChange();
										setSettingsShown(current => {
											const currentWithCategory = [
												...current,
												...settings
													.filter(setting => setting.category === option.label)
													.map(setting => setting.key),
											];
											return Array.from(new Set(currentWithCategory));
										});
									}}
								>
									{option.label}
								</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown>
					<button
						className="btn btn-danger ms-2"
						onClick={() => {
							onAnyChange();
							setSettingsShown([]);
						}}
					>
						Clear All
					</button>
					<div className="btn-group ms-2">
						<ImportButton
							onBeforeImport={() => {
								setImportErrorMessage(undefined);
							}}
							onError={errorMessage => {
								setImportErrorMessage(errorMessage);
							}}
							onImport={settings => {
								onAnyChange();

								const newOverrides = removeSettingsEqualToDefault(
									removeUnknownSettings(settings),
								);
								setOverridesLocal(newOverrides);
								setSettingsShown(getKeysFromOverrides(newOverrides));
								setOverridesLocalCounter(counter => counter + 1);
							}}
						/>
						<ExportButton />
					</div>
				</div>
			</div>

			{importErrorMessage ? (
				<p className="text-danger">Error during import: {importErrorMessage}</p>
			) : null}

			<SettingsForm
				key={overridesLocalCounter}
				onSave={async settingsFromSave => {
					console.log(settingsFromSave);

					const newDefaultSettings: Partial<Settings> = {
						...settingsFromSave,
					};

					// Enforce godModeInPast always is the same as godMode
					if (newDefaultSettings.godMode) {
						newDefaultSettings.godModeInPast = true;
					} else {
						// If godMode or godModeInPast is false, can delete, that is already the default. Those are always here because of SPECIAL_STATE_BOOLEANS
						delete newDefaultSettings.godMode;
						delete newDefaultSettings.godModeInPast;
					}

					const newDefaultSettings2 = removeSettingsEqualToDefault(
						removeUnknownSettings(newDefaultSettings),
					);

					// If God Mode is disabled, so no God Mode settings can be included still
					if (!newDefaultSettings.godMode) {
						const godModeKeys = [];

						for (const key of helpers.keys(newDefaultSettings2)) {
							const setting = settingsByKey[key][0];
							if (setting?.godModeRequired === "always") {
								godModeKeys.push(setting.name);
							}
						}

						if (godModeKeys.length > 0) {
							logEvent({
								type: "error",
								text: `The following settings require God Mode to be enabled to be changed:<br>- ${godModeKeys.join(
									"<br>- ",
								)}`,
								saveToDb: false,
								persistent: true,
							});
						}
					}

					await toWorker(
						"main",
						"updateDefaultSettingsOverrides",
						newDefaultSettings2,
					);

					localActions.update({
						dirtySettings: false,
					});

					logEvent({
						type: "success",
						text: "New league default settings successfully updated.",
						saveToDb: false,
					});
				}}
				onCancel={() => {
					realtimeUpdate([], "/settings");
				}}
				onCancelDefaultSetting={key => {
					onAnyChange();
					setSettingsShown(shown => shown.filter(key2 => key2 !== key));
				}}
				onUpdateExtra={() => {
					localActions.update({
						dirtySettings: true,
					});
				}}
				saveText="Save Default Settings"
				initialSettings={{
					...defaultSettings,
					...overridesLocal,
				}}
				settingsShown={settingsShown}
				hideShortcuts
				alwaysShowGodModeSettings
				// Enable everything so we get all options
				hasPlayers
				newLeague
				realPlayers
				defaultNewLeagueSettings
			/>
		</>
	);
};

export default DefaultNewLeagueSettings;
