import { useState } from "react";
import Select from "react-select";
import { SPORT_HAS_REAL_PLAYERS } from "../../../common";
import { groupBy } from "../../../common/groupBy";
import { settings } from "../Settings/settings";

const DefaultNewLeagueSettings = () => {
	const [settingsShown, setSettingsShown] = useState<Key[]>([]);

	const allSettings = settings.filter(
		setting => !setting.hidden && !settingsShown.includes(setting.key),
	);

	const options = Object.entries(groupBy(allSettings, "category")).map(
		([category, catSettings]) => ({
			label: category,
			options: catSettings.map(setting => ({
				label: setting.name,
				value: setting.key,
			})),
		}),
	);
	console.log(options);

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

			<Select
				classNamePrefix="dark-select"
				onChange={(newValue: any) => {
					setSettingsShown(shown => [...shown, newValue.value]);
				}}
				options={options}
				placeholder="Select a setting to supply a new default value for..."
				value={null}
			/>
		</>
	);
};

export default DefaultNewLeagueSettings;
