import { useState } from "react";
import Select from "react-select";
import { SPORT_HAS_REAL_PLAYERS } from "../../common";
import { groupBy } from "../../common/groupBy";
import type { Settings } from "../../worker/views/settings";
import { MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { settings } from "./Settings/settings";
import SettingsForm, { getVisibleCategories } from "./Settings/SettingsForm";
import SettingsFormOptions from "./Settings/SettingsFormOptions";
import type { Key } from "./Settings/types";
import useSettingsFormState from "./Settings/useSettingsFormState";

const DefaultNewLeagueSettings = ({
	initialSettings,
}: {
	initialSettings: Settings;
}) => {
	useTitleBar({ title: "Default New League Settings" });

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

	console.log("options", options);
	console.log("initialSettings", initialSettings);

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

			<SettingsForm
				onSave={settings => {
					console.log(settings);

					const newDefaultSettings = {
						...settings,
					};

					// If godMode or godModeInPast is false, can delete, that is already the default. Those are always here because of SPECIAL_STATE_BOOLEANS
					for (const key of ["godMode", "godModeInPast"] as const) {
						if (!newDefaultSettings[key]) {
							delete newDefaultSettings[key];
						}
					}

					console.log("newDefaultSettings", newDefaultSettings);
				}}
				saveText="Save Default Settings"
				initialSettings={initialSettings}
				settingsShown={settingsShown}
				hideShortcuts
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
