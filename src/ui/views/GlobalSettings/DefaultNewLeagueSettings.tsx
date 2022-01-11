import { useState } from "react";
import Select from "react-select";
import { SPORT_HAS_REAL_PLAYERS } from "../../../common";
import { groupBy } from "../../../common/groupBy";
import type { Settings } from "../../../worker/views/settings";
import { settings } from "../Settings/settings";
import { getVisibleCategories } from "../Settings/SettingsForm";
import SettingsFormOptions from "../Settings/SettingsFormOptions";
import type { Key } from "../Settings/types";
import useSettingsFormState from "../Settings/useSettingsFormState";

const DefaultNewLeagueSettings = ({
	defaultSettings,
}: {
	defaultSettings: Settings;
}) => {
	const [settingsShown, setSettingsShown] = useState<Key[]>([]);

	const settingsRemainingToSelect = settings.filter(
		setting => !setting.hidden && !settingsShown.includes(setting.key),
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

	const {
		godMode,
		handleChange,
		handleChangeRaw,
		state,
		setState,
		gameSimPreset,
		setGameSimPreset,
	} = useSettingsFormState({
		initialSettings: defaultSettings,
	});
	console.log("options", options);
	console.log("defaultSettings", defaultSettings);
	console.log("state", state);

	const filteredSettings = settings.filter(
		setting => !setting.hidden && settingsShown.includes(setting.key),
	);

	const visibleCategories = getVisibleCategories({
		godMode,
		filteredSettings,
		newLeague: true,
		showGodModeSettings: true,
	});

	return (
		<>
			<h2>Default New League Settings</h2>

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

			<Select<{
				label: string;
				value: Key;
			}>
				classNamePrefix="dark-select"
				className="mb-3"
				onChange={newValue => {
					if (newValue) {
						setSettingsShown(shown => [...shown, newValue.value]);
					}
				}}
				options={options}
				placeholder="Select a setting to supply a new default value for..."
				value={null}
			/>

			<SettingsFormOptions
				disabled={false}
				gameSimPreset={gameSimPreset}
				godMode={godMode}
				handleChange={handleChange}
				handleChangeRaw={handleChangeRaw}
				newLeague={true}
				setGameSimPreset={setGameSimPreset}
				showGodModeSettings={true}
				state={state}
				visibleCategories={visibleCategories}
			/>
		</>
	);
};

export default DefaultNewLeagueSettings;
