import { useState } from "react";
import Select from "react-select";
import type { Settings } from "../../../worker/views/settings.ts";
import { helpers } from "../../util/helpers.ts";
import { getSettingsShown } from "../Settings/getSettingsShown.ts";
import { settings } from "../Settings/settings.tsx";
import SettingsForm from "../Settings/SettingsForm.tsx";
import type { Key } from "../Settings/types.ts";
import { type EditProps, gameAttributeName } from "./common.tsx";

// When these are changed in the normal league settings form, more is done than just setting the value. That is not supported by scheduled events.
const UNSUPPORTED_KEYS = new Set<Key>([
	"forceHistoricalRosters",
	"realPlayerDeterminism",
	"repeatSeason",
	"rpdPot",
]);

// showOnlyIf is for settings that only apply in a new league
const supportedSettings = settings.filter(
	(setting) =>
		!UNSUPPORTED_KEYS.has(setting.key) &&
		(!setting.showOnlyIf || setting.showOnlyIf({})),
);

// Includes hidden settings that are edited in the form for another setting
const supportedKeys = new Set<string>(
	supportedSettings.flatMap((setting) =>
		setting.partners ? [setting.key, ...setting.partners] : setting.key,
	),
);

const EditGameAttributes = ({
	event,
	initialSettings,
	onCancel,
	onSave,
	setError,
}: EditProps<"gameAttributes"> & {
	initialSettings: Settings;
}) => {
	const [settingsShown, setSettingsShown] = useState<Key[]>(() => {
		if (!event) {
			return [];
		}

		return getSettingsShown(
			Object.keys(event.info).filter((key) => supportedKeys.has(key)),
		);
	});

	// Scheduled events can change things that are not in the settings form, like conferences and divisions. Those can't be edited here, but they can be kept or removed.
	const [otherKeys, setOtherKeys] = useState(() => {
		if (!event) {
			return [];
		}

		return helpers.keys(event.info).filter((key) => !supportedKeys.has(key));
	});

	const [initialSettingsWithEvent] = useState(() => {
		const output = {
			...initialSettings,
		};

		if (event) {
			for (const key of helpers.keys(event.info)) {
				if (supportedKeys.has(key)) {
					(output as any)[key] = event.info[key];
				}
			}
		}

		return output;
	});

	const options = Array.from(
		Map.groupBy(
			supportedSettings.filter(
				(setting) => !setting.hidden && !settingsShown.includes(setting.key),
			),
			(row) => row.category,
		),
	).map(([category, catSettings]) => ({
		label: category,
		options: catSettings.map((setting) => ({
			label: setting.name,
			value: setting.key,
		})),
	}));

	return (
		<>
			<div className="mb-3" style={{ maxWidth: 500 }}>
				<Select<{
					label: string;
					value: Key;
				}>
					classNamePrefix="dark-select"
					onChange={(newValue) => {
						if (newValue) {
							setSettingsShown((shown) => [...shown, newValue.value]);

							// In case the error was about no settings being selected
							setError(undefined);
						}
					}}
					options={options}
					placeholder="Select a setting to change..."
					value={null}
				/>
			</div>

			{otherKeys.length > 0 ? (
				<div className="mb-3">
					<div>
						This event also changes these, which can't be edited here but you
						can remove them:
					</div>
					<ul className="list-unstyled mb-0">
						{otherKeys.map((key) => (
							<li key={key} className="mt-1">
								{gameAttributeName(key)}
								<button
									type="button"
									className="btn btn-link text-danger p-0 border-0 ms-2"
									title="Remove"
									onClick={() => {
										setOtherKeys((keys) => keys.filter((key2) => key2 !== key));
									}}
								>
									<span className="glyphicon glyphicon-remove" />
								</button>
							</li>
						))}
					</ul>
				</div>
			) : null}

			<SettingsForm
				onSave={async (output) => {
					const info: Parameters<typeof onSave>[0] = {};

					if (event) {
						for (const key of otherKeys) {
							(info as any)[key] = event.info[key];
						}
					}

					for (const key of helpers.keys(output)) {
						// godMode and godModeInPast are always included by SettingsForm
						if (supportedKeys.has(key)) {
							(info as any)[key] = output[key];
						}
					}

					if (Object.keys(info).length === 0) {
						setError("Select at least one setting to change.");
						return;
					}

					await onSave(info);
				}}
				onCancel={onCancel}
				onCancelDefaultSetting={(key) => {
					setSettingsShown((shown) => shown.filter((key2) => key2 !== key));
				}}
				saveText="Save"
				initialSettings={initialSettingsWithEvent}
				settingsShown={settingsShown}
				hideShortcuts
				hideGodModeToggle
				alwaysShowGodModeSettings
				isInsideModal
				// Only some settings are in the form, so validation needs initialSettings for the rest
				defaultNewLeagueSettings
			/>
		</>
	);
};

export default EditGameAttributes;
